from ingest_service.parsing import summarize_state_categories, to_positions_raw_rows


def state(category, *, time_position=100, latitude=55.0, longitude=37.0):
    return [
        "abcdef",
        "TEST123 ",
        "Test Country",
        time_position,
        100,
        longitude,
        latitude,
        1_000.0,
        False,
        100.0,
        90.0,
        1.0,
        None,
        1_050.0,
        "7000",
        False,
        0,
        category,
    ]


def payload(*states):
    return {"time": 100, "states": list(states)}


def test_unknown_and_airplane_categories_are_kept():
    rows = to_positions_raw_rows(
        payload(
            state(0),
            state(1),
            state(2),
            state(7),
            state(8),
            state(9),
            state(14),
            state(None),
        )
    )

    assert [row["category"] for row in rows] == [0, 1, 2, 7, None]


def test_unexpected_categories_are_kept_for_later_classification():
    rows = to_positions_raw_rows(payload(state(21), state(-1), state("other")))

    assert [row["category"] for row in rows] == [21, -1]


def test_state_without_extended_category_is_treated_as_unknown():
    state_without_category = state(2)[:-1]

    assert len(to_positions_raw_rows(payload(state_without_category))) == 1


def test_invalid_position_is_still_rejected_after_category_filtering():
    rows = to_positions_raw_rows(
        payload(
            state(2, time_position=None),
            state(2, latitude=None),
            state(2, longitude=None),
            state(2),
        )
    )

    assert len(rows) == 1


def test_category_summary_counts_source_rows_and_invalid_positions():
    short_state = state(2)[:-1]
    invalid_state = state(8, latitude=None)

    summary = summarize_state_categories(
        payload(state(None), state(0), state(2), state(2), invalid_state, short_state)
    )

    assert summary == (
        "null=2 0=1 1=0 2=2 3=0 4=0 5=0 6=0 7=0 8=1 9=0 10=0 "
        "11=0 12=0 13=0 14=0 15=0 16=0 17=0 18=0 19=0 20=0 "
        "invalid_position=1"
    )


def test_category_summary_reports_unexpected_values():
    assert "unexpected='other':1" in summarize_state_categories(payload(state("other")))

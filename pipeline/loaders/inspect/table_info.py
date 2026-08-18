import os
import yt.wrapper as yt
import sys
import argparse
from pathlib import Path
from yt.wrapper import YtClient

sys.path.insert(0, str(Path(__file__).parent.parent.parent))
from config import YT_PROXY

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--table", required=True)
    parser.add_argument("--proxy", default=YT_PROXY)
    parser.add_argument("--token", default=os.getenv("YT_TOKEN"))
    args = parser.parse_args()

    client = YtClient(proxy=args.proxy, token=args.token or None, config={"backend": "http"})
    table_path = args.table
    
    if not client.exists(table_path):
        print(f"ERROR: Table {table_path} does not exist")
        sys.exit(1)
    
    print(f"Table: {table_path}")
    print("=" * 60)
    
    attrs = [
        "type",
        "dynamic",
        "sorted",
        "row_count",
        "chunk_count",
        "compression_codec",
        "primary_medium",
        "account",
    ]
    
    for attr in attrs:
        try:
            value = client.get(f"{table_path}/@{attr}")
            print(f"{attr:20}: {value}")
        except Exception:
            print(f"{attr:20}: N/A")
    
    print("")
    
    try:
        key_columns = client.get(f"{table_path}/@key_columns")
        if key_columns:
            print(f"Key columns: {', '.join(key_columns)}")
        else:
            print("Key columns: none (static table)")
    except Exception:
        print("Key columns: N/A")
    
    print("")
    
    try:
        dynamic = client.get(f"{table_path}/@dynamic")
        if dynamic:
            tablet_state = client.get(f"{table_path}/@tablet_state")
            print(f"Tablet state: {tablet_state}")
            print(f"Tablet count: {client.get(f'{table_path}/@tablet_count')}")
    except Exception:
        pass
    
    print("")
    
    print("Schema:")
    print("-" * 40)
    try:
        schema = client.get(f"{table_path}/@schema")
        for col in schema:
            name = col.get("name", "?")
            required = "NOT NULL" if col.get("required", False) else "NULL"
            type_ = col.get("type_v3", col.get("type", "?"))
            if isinstance(type_, dict):
                type_name = type_.get("type_name", type_.get("item", "?"))
                if type_name == "optional":
                    type_ = f"optional<{type_.get('item', '?')}>"
                else:
                    type_ = str(type_)
            print(f"  {name:25} {type_:25} {required}")
    except Exception as e:
        print(f"  Error getting schema: {e}")

if __name__ == "__main__":
    main()
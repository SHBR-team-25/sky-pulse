import sys
import argparse
from pyspark.sql import SparkSession
from pyspark.sql.functions import *

def parse_arguments():
    parser = argparse.ArgumentParser(description='Streaming job')
    parser.add_argument('--input', required=True, help='Input path in YT')
    parser.add_argument('--output', required=True, help='Output path in YT')
    parser.add_argument('--checkpoint', required=True, help='Checkpoint path')
    return parser.parse_args()

def create_streaming_session():
    return SparkSession.builder \
        .appName("SPYT_Streaming_Job") \
        .config("spark.sql.streaming.schemaInference", "true") \
        .config("spark.streaming.stopGracefullyOnShutdown", "true") \
        .config("spark.sql.streaming.metricsEnabled", "true") \
        .getOrCreate()

def main():
    args = parse_arguments()
    
    spark = create_streaming_session()
    
    print(f"Starting streaming job:")
    print(f"  Input: {args.input}")
    print(f"  Output: {args.output}")
    print(f"  Checkpoint: {args.checkpoint}")
    
    df = spark.readStream \
        .format("yt") \
        .option("path", args.input) \
        .load()
    
    # Example transformation - replace with your logic
    result_df = df \
        .withColumn("processed_at", current_timestamp()) \
        .withColumn("event_date", to_date(col("time_position"))) \
        .groupBy("icao24", "event_date") \
        .agg(
            count("*").alias("total_positions"),
            avg("altitude").alias("avg_altitude"),
            avg("speed").alias("avg_speed")
        )
    
    query = result_df.writeStream \
        .format("yt") \
        .option("path", args.output) \
        .option("checkpointLocation", args.checkpoint) \
        .outputMode("append") \
        .trigger(processingTime="10 seconds") \
        .start()
    
    query.awaitTermination()

if __name__ == "__main__":
    main()
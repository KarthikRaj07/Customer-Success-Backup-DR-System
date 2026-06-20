import json
from datetime import datetime
from aws_config import s3
import os

BUCKET_NAME = os.getenv("AWS_BUCKET_NAME")

def create_backup_file(data):
    file_name = f"backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
    
    with open(file_name, "w") as f:
        json.dump(data, f)
    
    return file_name


def upload_to_s3(file_name):
    s3.upload_file(file_name, BUCKET_NAME, file_name)
    return f"Uploaded {file_name} to S3"

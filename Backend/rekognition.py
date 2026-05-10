import boto3
import os
from dotenv import load_dotenv
load_dotenv()
print("Collection deleted.")
rekognition = boto3.client('rekognition', 
                           region_name='us-east-1',
                           aws_access_key_id="AKIATRKKXHRVMAOQHFHY",
                          aws_secret_access_key="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")



rekognition.create_collection(CollectionId="Student")
print("Collection deleted.")

    
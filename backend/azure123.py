from azure.storage.blob import BlobServiceClient
connection_string =
blob_service_client = BlobServiceClient.from_connection_string(connection_string)
print("Containers:")
container_name = 'datasets'
container_client = blob_service_client.get_container_client(container_name)
blobs = container_client.list_blobs()
datasets_list=[]
for blob in blobs:
    datasets_list.append(blob.name)
print(datasets_list)



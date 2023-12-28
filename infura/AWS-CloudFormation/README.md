# Golf District AWS Infrastructure README

## Infrastructure Overview:

### 1. **S3 Bucket (Golf District Bucket)**

- **Usage**: Storage for files and data.
- **Removal Policy**: The bucket will be removed if the CloudFormation stack is deleted.
- **CORS**: Allows `POST` requests from any origin.

### 2. **CloudFront Distribution (golf-district-distribution)**

- **Usage**: Content delivery for the application, caching content from the S3 bucket.
- **Origin**: Sources content from the Golf District S3 bucket.
- **Origin Access Identity**: "golf-district-identity". This identity is given permissions to fetch content from the S3 bucket.

## Permissions:

### 1. **S3 Bucket**:

- Lambda functions have permission to:
  - Retrieve objects: `s3:GetObject` (All objects within the bucket).
  - Fetch bucket tagging configuration: `s3:GetBucketTagging`.

### 2. **CloudFront**:

- Has permission to access the S3 bucket content via the Origin Access Identity.

### 3. **Gold District Application IAM User**:

- Has permission to:
  - Geocode addresses using the **Gold-District-GeoCode-Index**.
  - Retrieve, add, and list objects in the S3 bucket.

### Outputs:

- **GeoUserAccessKeyId**: Access Key ID for the IAM user.
- **GeoUserSecretAccessKey**: Secret Access Key for the IAM user.
- **golf-district-Distribution**: CloudFront distribution domain name.

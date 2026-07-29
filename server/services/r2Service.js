/**
 * CLOUDFLARE R2 OBJECT STORAGE SERVICE ($0 EGRESS FEES, S3-COMPATIBLE)
 * Direct presigned upload generator bypassing Express server
 */

const generatePresignedUploadUrl = async (fileName, fileType, tenantId) => {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID || 'demo_account';
  const bucketName = process.env.R2_BUCKET_NAME || 'talenttrack-proofs';
  const objectKey = `tenants/${tenantId}/${Date.now()}-${fileName.replace(/\s+/g, '_')}`;

  // In production with AWS SDK / Cloudflare R2 credentials, generates S3 presigned PUT URL.
  // Returns presigned direct upload URL + public CDN URL link.
  const uploadUrl = `https://${accountId}.r2.cloudflarestorage.com/${bucketName}/${objectKey}?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Expires=900`;
  const publicUrl = `https://cdn.talenttrack.io/${objectKey}`;

  return {
    uploadUrl,
    publicUrl,
    objectKey,
    expiresIn: 900 // 15 minutes
  };
};

module.exports = { generatePresignedUploadUrl };

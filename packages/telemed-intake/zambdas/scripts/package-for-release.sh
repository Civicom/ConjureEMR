# Where this script is located (https://stackoverflow.com/a/246128)
SCRIPTS_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )

# Clean and set up base directories
rm -r $SCRIPTS_DIR/../.dist
mkdir -p $SCRIPTS_DIR/../.dist
mkdir -p $SCRIPTS_DIR/../.dist/temp

# Where `serverless package` puts deployment artifacts
SLS_DIR=$(realpath $SCRIPTS_DIR/../.serverless)
# Where we will build and place deployable zips
DIST_DIR=$(realpath $SCRIPTS_DIR/../.dist)

# Every time we add a new endpoint in serverless.yml we should dublicate it's name here, otherwise it will not be deployed
# Zip

ZIP_ORDER=('get-patients' 'get-providers' 'get-groups' 'get-locations' 'get-paperwork' 'create-paperwork' 'update-paperwork' 'update-appointment' 'create-appointment' 'get-appointments' 'get-schedule' 'cancel-telemed-appointment' 'cancel-in-person-appointment' 'get-wait-status' 'join-call' 'video-chat-invites-create' 'video-chat-invites-cancel' 'video-chat-invites-list' 'get-presigned-file-url' 'payment-methods-setup' 'payment-methods-list' 'payment-methods-set-default' 'payment-methods-delete')

for ZAMBDA in ${ZIP_ORDER[@]}; do
  # Set up temp directory for the zip
  mkdir -p "$DIST_DIR/temp/$ZAMBDA"
  # Unzip into temp
  unzip "$SLS_DIR/$ZAMBDA.zip" -d "$DIST_DIR/temp/$ZAMBDA"
  # Make deployable zip in .dist
  zip -jr "$DIST_DIR/$ZAMBDA.zip" "$DIST_DIR/temp/$ZAMBDA"
done

# Clean up temp
# rm -r $DIST_DIR/temp

# Announce victory
echo ''
echo 'Zambda zips are ready to deploy from the .dist directory.'

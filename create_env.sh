#!/bin/bash

# Créer le fichier .env
cat > .env << EOL
# Configuration du serveur
PORT=3000
PASSWORD=password
SECRET=secret
TITLE=OpenVidReview

# Configuration Cloudinary
CLOUDINARY_CLOUD_NAME=VOTRE_CLOUD_NAME
CLOUDINARY_API_KEY=653643671545153
CLOUDINARY_API_SECRET=tFhGZNihnQXNhLvRsgmxYpIUJEY
EOL

echo "Fichier .env créé avec succès."
echo "Veuillez remplacer VOTRE_CLOUD_NAME par votre cloud name Cloudinary."

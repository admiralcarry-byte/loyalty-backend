# Use Node.js 20 Alpine image for compatibility with simple-xml-to-json
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Install system dependencies required for native modules (canvas, sharp, etc.)
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    cairo-dev \
    jpeg-dev \
    pango-dev \
    musl-dev \
    giflib-dev \
    pixman-dev \
    pangomm-dev \
    libjpeg-turbo-dev \
    freetype-dev

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --omit=dev

# Copy source code
COPY . .

# Create uploads directory
RUN mkdir -p uploads/qr-codes uploads/receipts

# Expose port
EXPOSE 5000

# Start the application
CMD ["npm", "start"]
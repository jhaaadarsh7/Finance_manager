# Use official lightweight Node.js Alpine image
FROM node:18-alpine as base

# Set working directory inside the container
WORKDIR /app

# Install dependencies separately to take advantage of Docker's caching mechanism
COPY package.json package-lock.json ./

RUN npm install --omit=dev

# Copy application source code
COPY . .

# Create a non-root user for better security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001 && \
    chown -R nextjs:nodejs /app

# Switch to the non-root user
USER nextjs

# Expose application port
EXPOSE 3000

# Health check to ensure the service is running
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node src/utils/healthcheck.js || exit 1

# Start the application
CMD ["npm", "start"]

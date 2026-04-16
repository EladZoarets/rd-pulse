FROM node:20-alpine

# Install the connector globally
RUN npm install -g rdpulse-connector@0.2.4

# Set up the dashboard server
WORKDIR /server
COPY package.json .
RUN npm install --omit=dev

COPY server.js .
COPY public/ public/

# Reports are stored in a volume so they persist across restarts
RUN mkdir -p /reports
VOLUME /reports

EXPOSE 3000
CMD ["node", "server.js"]

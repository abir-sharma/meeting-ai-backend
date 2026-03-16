FROM node:18-alpine

# Working Directory in container, Commands will be issued relative to this dir
WORKDIR /usr/src/app

# Copy all Remaining Code/ Add folders like node_modules in .dockerignore
COPY package*.json /usr/src/app/
COPY . .

# COPY .env .env

# Install All Dependencies
RUN npm ci

RUN npm run build

#Set command to run 

EXPOSE 4200

CMD ["node", "dist/main"]
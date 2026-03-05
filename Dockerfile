FROM node:20-alpine as build
 
# Set the working directory inside the container
WORKDIR /app
 
# Copy package.json and package-lock.json
COPY package*.json ./
 
# Install dependencies
RUN npm install
 
# Copy the rest of your application files
COPY . .

# Build-time env vars (CRA bakes these into the JS bundle)
ARG REACT_APP_GOOGLE_MAPS_API_KEY
ENV REACT_APP_GOOGLE_MAPS_API_KEY=$REACT_APP_GOOGLE_MAPS_API_KEY

ARG REACT_APP_API_URL
ENV REACT_APP_API_URL=$REACT_APP_API_URL

ARG REACT_APP_GOOGLE_CLIENT_ID
ENV REACT_APP_GOOGLE_CLIENT_ID=$REACT_APP_GOOGLE_CLIENT_ID

RUN npm run build 
# Expose the port your app runs on
FROM node:20-alpine

WORKDIR /app
RUN npm install -g serve

COPY --from=build /app/build ./build

EXPOSE 3001
ENV PORT 3001
 
# Define the command to run your app
CMD ["serve", "-s", "build", "--listen", "3001"]

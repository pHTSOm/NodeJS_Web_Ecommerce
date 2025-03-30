522K0008 Nguyen Truong Phat
521V0006 Nguyen Cao Phi
522K0012 Nguyen Truong Phat



# Quick Start

The application can be started with a single command using Docker Compose:
docker compose up -d

This command:

Builds all necessary images (if not already built)
Creates and starts all containers
Sets up the required network
Configures database with initial data
Runs the application

Once complete, access:

Frontend: http://localhost (port 80)
Backend API: http://localhost:5000/api
MySQL database: localhost:3307 (mapped from container port 3306)

Default admin login:

Email: admin@gmail.com
Password: admin123456

# 1. Building Images Manually 
# Build backend image
docker build -t ecommerce-backend ./backend

# Build frontend image
docker build -t ecommerce-frontend ./frontend

# 2. Running Individual Containers
# Run MySQL container
docker run -d --name mysql-container \
  -e MYSQL_ROOT_PASSWORD=root_password \
  -e MYSQL_DATABASE=NodeJS_midterm_db \
  -e MYSQL_USER=user \
  -e MYSQL_PASSWORD=password \
  -p 3307:3306 \
  -v mysql_data:/var/lib/mysql \
  mysql:8.0

# Run backend container (after MySQL is running)
docker run -d --name backend-container \
  -e DB_HOST=mysql-container \
  -e DB_USER=user \
  -e DB_PASSWORD=password \
  -e DB_NAME=NodeJS_midterm_db \
  -p 5000:5000 \
  --link mysql-container \
  ecommerce-backend

# Run frontend container
docker run -d --name frontend-container \
  -p 80:80 \
  --link backend-container \
  ecommerce-frontend

# 3. Docker Compose Commands
# Start all services in the background
docker compose up -d

# View running containers
docker compose ps

# View logs from all containers
docker compose logs

# View logs from a specific service
docker compose logs backend

# Stop all containers without removing them
docker compose stop

# Stop and remove all containers, networks
docker compose down

# Stop and remove all containers, networks, and volumes (this will delete database data)
docker compose down -v

# Rebuild images and start containers
docker compose up -d --build
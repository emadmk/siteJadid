#!/bin/bash

#############################################
# SiteJadid E-commerce Platform Installer
# Automated installation script for Ubuntu/Debian
#############################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Print functions
print_header() {
    echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║    SiteJadid E-commerce Platform Installer           ║${NC}"
    echo -e "${BLUE}║    Safety Equipment Enterprise Platform              ║${NC}"
    echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"
    echo ""
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

# Check if running as root
check_root() {
    if [ "$EUID" -eq 0 ]; then
        print_error "Please do not run this script as root"
        print_info "Run as normal user with sudo privileges"
        exit 1
    fi
}

# Check OS
check_os() {
    print_info "Checking operating system..."

    if [ -f /etc/os-release ]; then
        . /etc/os-release
        OS=$NAME
        VER=$VERSION_ID
    else
        print_error "Cannot determine OS"
        exit 1
    fi

    if [[ "$OS" != *"Ubuntu"* ]] && [[ "$OS" != *"Debian"* ]]; then
        print_warning "This script is designed for Ubuntu/Debian"
        read -p "Continue anyway? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi

    print_success "OS: $OS $VER"
}

# Update system
update_system() {
    print_info "Updating system packages..."
    sudo apt-get update -qq
    sudo apt-get upgrade -y -qq
    print_success "System updated"
}

# Install Node.js
install_nodejs() {
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node --version)
        print_success "Node.js already installed: $NODE_VERSION"
        return
    fi

    print_info "Installing Node.js 18.x..."

    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs

    NODE_VERSION=$(node --version)
    NPM_VERSION=$(npm --version)

    print_success "Node.js $NODE_VERSION installed"
    print_success "npm $NPM_VERSION installed"
}

# Install PostgreSQL
install_postgresql() {
    if command -v psql &> /dev/null; then
        print_success "PostgreSQL already installed"
        return
    fi

    print_info "Installing PostgreSQL..."

    sudo apt-get install -y postgresql postgresql-contrib
    sudo systemctl start postgresql
    sudo systemctl enable postgresql

    print_success "PostgreSQL installed and started"
}

# Setup PostgreSQL database
setup_database() {
    print_info "Setting up database..."

    read -p "Enter database name [sitejadid]: " DB_NAME
    DB_NAME=${DB_NAME:-sitejadid}

    read -p "Enter database user [siteuser]: " DB_USER
    DB_USER=${DB_USER:-siteuser}

    read -sp "Enter database password: " DB_PASS
    echo

    # Create database and user
    sudo -u postgres psql -c "CREATE DATABASE $DB_NAME;" 2>/dev/null || print_warning "Database already exists"
    sudo -u postgres psql -c "CREATE USER $DB_USER WITH PASSWORD '$DB_PASS';" 2>/dev/null || print_warning "User already exists"
    sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;"
    sudo -u postgres psql -c "ALTER USER $DB_USER CREATEDB;"

    # Store database credentials
    export DATABASE_URL="postgresql://$DB_USER:$DB_PASS@localhost:5432/$DB_NAME"

    print_success "Database created: $DB_NAME"
}

# Install Redis
install_redis() {
    if command -v redis-cli &> /dev/null; then
        print_success "Redis already installed"
        return
    fi

    print_info "Installing Redis..."

    sudo apt-get install -y redis-server
    sudo systemctl start redis-server
    sudo systemctl enable redis-server

    # Test Redis
    if redis-cli ping | grep -q "PONG"; then
        print_success "Redis installed and running"
    else
        print_error "Redis installation failed"
        exit 1
    fi
}

# Install Nginx
install_nginx() {
    if command -v nginx &> /dev/null; then
        print_success "Nginx already installed"
        return
    fi

    print_info "Installing Nginx..."

    sudo apt-get install -y nginx
    sudo systemctl start nginx
    sudo systemctl enable nginx

    print_success "Nginx installed and running"
}

# Install PM2
install_pm2() {
    if command -v pm2 &> /dev/null; then
        print_success "PM2 already installed"
        return
    fi

    print_info "Installing PM2..."

    sudo npm install -g pm2

    print_success "PM2 installed"
}

# Clone repository
clone_repository() {
    print_info "Cloning repository..."

    read -p "Enter installation directory [/home/$USER/siteJadid]: " INSTALL_DIR
    INSTALL_DIR=${INSTALL_DIR:-/home/$USER/siteJadid}

    if [ -d "$INSTALL_DIR" ]; then
        print_warning "Directory $INSTALL_DIR already exists"
        read -p "Continue and overwrite? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
        cd $INSTALL_DIR
    else
        read -p "Enter Git repository URL [skip if using local files]: " GIT_URL

        if [ -n "$GIT_URL" ]; then
            git clone $GIT_URL $INSTALL_DIR
            cd $INSTALL_DIR
            print_success "Repository cloned to $INSTALL_DIR"
        else
            print_warning "Skipping git clone, using current directory"
            INSTALL_DIR=$(pwd)
        fi
    fi

    export INSTALL_DIR
}

# Install dependencies
install_dependencies() {
    print_info "Installing npm dependencies..."

    cd $INSTALL_DIR
    npm install

    print_success "Dependencies installed"
}

# Setup environment
setup_environment() {
    print_info "Setting up environment variables..."

    cd $INSTALL_DIR

    if [ ! -f .env.example ]; then
        print_error ".env.example not found"
        exit 1
    fi

    cp .env.example .env

    # Generate secrets
    NEXTAUTH_SECRET=$(openssl rand -base64 32)
    SESSION_SECRET=$(openssl rand -base64 32)

    # Update .env file
    sed -i "s|DATABASE_URL=.*|DATABASE_URL=\"$DATABASE_URL\"|g" .env
    sed -i "s|NEXTAUTH_SECRET=.*|NEXTAUTH_SECRET=\"$NEXTAUTH_SECRET\"|g" .env
    sed -i "s|SESSION_SECRET=.*|SESSION_SECRET=\"$SESSION_SECRET\"|g" .env

    read -p "Enter your domain name (e.g., example.com) [localhost]: " DOMAIN
    DOMAIN=${DOMAIN:-localhost}

    if [ "$DOMAIN" = "localhost" ]; then
        NEXTAUTH_URL="http://localhost:3000"
    else
        NEXTAUTH_URL="https://$DOMAIN"
    fi

    sed -i "s|NEXTAUTH_URL=.*|NEXTAUTH_URL=\"$NEXTAUTH_URL\"|g" .env

    # Stripe keys (optional)
    print_info "Stripe configuration (optional - press Enter to skip)"
    read -p "Enter Stripe Secret Key: " STRIPE_KEY
    if [ -n "$STRIPE_KEY" ]; then
        sed -i "s|STRIPE_SECRET_KEY=.*|STRIPE_SECRET_KEY=\"$STRIPE_KEY\"|g" .env
    fi

    print_success "Environment configured"
    print_warning "Don't forget to update .env with your Stripe keys later!"
}

# Setup database schema
setup_schema() {
    print_info "Setting up database schema..."

    cd $INSTALL_DIR

    npx prisma generate
    npx prisma db push

    print_success "Database schema created"
}

# Build application
build_application() {
    print_info "Building application..."

    cd $INSTALL_DIR
    npm run build

    print_success "Application built"
}

# Setup PM2
setup_pm2() {
    print_info "Setting up PM2..."

    cd $INSTALL_DIR

    # Stop existing PM2 process
    pm2 delete siteJadid 2>/dev/null || true

    # Start with PM2
    pm2 start npm --name "siteJadid" -- start
    pm2 save

    # Setup startup script
    PM2_STARTUP=$(pm2 startup | tail -n 1)
    eval $PM2_STARTUP

    print_success "PM2 configured and running"
}

# Setup Nginx
setup_nginx() {
    print_info "Setting up Nginx..."

    if [ "$DOMAIN" = "localhost" ]; then
        print_warning "Skipping Nginx config for localhost"
        return
    fi

    cat > /tmp/sitejadid.conf << EOF
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF

    sudo mv /tmp/sitejadid.conf /etc/nginx/sites-available/sitejadid
    sudo ln -sf /etc/nginx/sites-available/sitejadid /etc/nginx/sites-enabled/

    sudo nginx -t
    sudo systemctl restart nginx

    print_success "Nginx configured for $DOMAIN"
}

# Setup SSL
setup_ssl() {
    if [ "$DOMAIN" = "localhost" ]; then
        return
    fi

    print_info "Do you want to setup SSL with Let's Encrypt?"
    read -p "Setup SSL? (y/N): " -n 1 -r
    echo

    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        return
    fi

    print_info "Installing Certbot..."
    sudo apt-get install -y certbot python3-certbot-nginx

    sudo certbot --nginx -d $DOMAIN -d www.$DOMAIN --non-interactive --agree-tos --email admin@$DOMAIN

    print_success "SSL certificate installed"
}

# Setup firewall
setup_firewall() {
    print_info "Do you want to configure firewall (UFW)?"
    read -p "Setup firewall? (y/N): " -n 1 -r
    echo

    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        return
    fi

    sudo ufw allow OpenSSH
    sudo ufw allow 'Nginx Full'
    sudo ufw --force enable

    print_success "Firewall configured"
}

# Create admin user
create_admin() {
    print_info "Creating admin user..."

    read -p "Enter admin email: " ADMIN_EMAIL
    read -sp "Enter admin password: " ADMIN_PASS
    echo

    cd $INSTALL_DIR

    # Create admin setup page URL
    print_info "Visit http://localhost:3000/setup-admin to create admin user"
    print_info "Email: $ADMIN_EMAIL"
    print_warning "Save this information!"
}

# Print summary
print_summary() {
    echo ""
    print_header
    print_success "Installation completed successfully!"
    echo ""
    print_info "Installation Directory: $INSTALL_DIR"
    print_info "Database: $DB_NAME"
    print_info "Application URL: $NEXTAUTH_URL"
    echo ""
    print_info "Useful Commands:"
    echo "  - View logs:     pm2 logs siteJadid"
    echo "  - Restart app:   pm2 restart siteJadid"
    echo "  - Stop app:      pm2 stop siteJadid"
    echo "  - Monitor:       pm2 monit"
    echo ""
    print_warning "Next Steps:"
    echo "  1. Visit $NEXTAUTH_URL/setup-admin to create admin user"
    echo "  2. Update Stripe keys in $INSTALL_DIR/.env"
    echo "  3. Configure email settings in $INSTALL_DIR/.env"
    echo ""
}

# Main installation flow
main() {
    print_header

    check_root
    check_os

    print_info "Starting installation..."
    echo ""

    update_system
    install_nodejs
    install_postgresql
    setup_database
    install_redis
    install_nginx
    install_pm2
    clone_repository
    install_dependencies
    setup_environment
    setup_schema
    build_application
    setup_pm2
    setup_nginx
    setup_ssl
    setup_firewall

    print_summary
}

# Run installation
main

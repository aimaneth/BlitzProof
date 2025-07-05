FROM ubuntu:20.04

# Set environment variables
ENV DEBIAN_FRONTEND=noninteractive
ENV PYTHONUNBUFFERED=1

# Install system dependencies
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    python3-venv \
    nodejs \
    npm \
    git \
    wget \
    curl \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Install Node.js 18
RUN curl -fsSL https://deb.nodesource.com/setup_18.x | bash - \
    && apt-get install -y nodejs

# Install Solidity compiler
RUN npm install -g solc

# Install Python security tools
RUN pip3 install slither-analyzer
RUN pip3 install mythril
RUN pip3 install manticore
RUN pip3 install z3-solver

# Install Oyente
RUN git clone https://github.com/enzymefinance/oyente.git \
    && cd oyente \
    && pip3 install -r requirements.txt \
    && python3 setup.py install \
    && cd .. \
    && rm -rf oyente

# Install Securify
RUN git clone https://github.com/eth-sri/securify.git \
    && cd securify \
    && pip3 install -r requirements.txt \
    && python3 setup.py install \
    && cd .. \
    && rm -rf securify

# Install Echidna
RUN wget https://github.com/crytic/echidna/releases/download/v2.0.4/echidna-test-2.0.4-Ubuntu-18.04.tar.gz \
    && tar -xzf echidna-test-2.0.4-Ubuntu-18.04.tar.gz \
    && mv echidna-test /usr/local/bin/ \
    && chmod +x /usr/local/bin/echidna-test \
    && rm echidna-test-2.0.4-Ubuntu-18.04.tar.gz

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install Node.js dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Create uploads directory
RUN mkdir -p uploads tools

# Expose port
EXPOSE 4000

# Start the application
CMD ["npm", "start"]
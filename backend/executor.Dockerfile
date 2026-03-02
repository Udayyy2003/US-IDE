FROM ubuntu:22.04

# Install all language runtimes
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    python3 \
    python3-pip \
    openjdk-17-jdk \
    && rm -rf /var/lib/apt/lists/*

# Create symlink for python
RUN ln -sf /usr/bin/python3 /usr/bin/python

# Create non-root user for security
RUN useradd -m -u 1000 executor
USER executor

WORKDIR /code

# Default command (overridden at runtime)
CMD ["/bin/sh"]

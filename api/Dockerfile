FROM php:8.2-cli

RUN apt-get update && apt-get install -y libpq-dev libzip-dev \
    && docker-php-ext-install pdo pdo_pgsql zip \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

COPY . /app
WORKDIR /app

CMD php -S 0.0.0.0:$PORT -t public
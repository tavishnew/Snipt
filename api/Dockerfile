FROM php:8.2-cli

COPY . /app
WORKDIR /app

RUN docker-php-ext-install pdo pdo_pgsql

CMD php -S 0.0.0.0:$PORT -t public
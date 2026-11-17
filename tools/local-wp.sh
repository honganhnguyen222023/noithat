#!/usr/bin/env bash
# Dựng nhanh một WordPress chạy thử (không cần MySQL – dùng SQLite) ở http://localhost:8080
# Yêu cầu: PHP 8.1+ (có pdo_sqlite), curl, unzip.  Dùng cho Mac/Linux.
# Windows: dùng LocalWP (localwp.com) – xem README.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
WP_DIR="$ROOT/wordpress"
PORT="${PORT:-8080}"
WP="php $ROOT/tools/wp-cli.phar --path=$WP_DIR"

if [ ! -f "$ROOT/tools/wp-cli.phar" ]; then
  curl -sSL -o "$ROOT/tools/wp-cli.phar" https://github.com/wp-cli/wp-cli/releases/download/v2.12.0/wp-cli-2.12.0.phar
fi

if [ ! -f "$WP_DIR/wp-config.php" ]; then
  mkdir -p "$WP_DIR"
  curl -sSL https://wordpress.org/latest.tar.gz | tar xz --strip-components=1 -C "$WP_DIR"
  curl -sSL -o /tmp/sqlite.zip https://downloads.wordpress.org/plugin/sqlite-database-integration.latest-stable.zip
  unzip -qo /tmp/sqlite.zip -d "$WP_DIR/wp-content/plugins/"
  cp "$WP_DIR/wp-content/plugins/sqlite-database-integration/db.copy" "$WP_DIR/wp-content/db.php"
  sed -i.bak "s#{SQLITE_IMPLEMENTATION_FOLDER_PATH}#$WP_DIR/wp-content/plugins/sqlite-database-integration#; s#{SQLITE_PLUGIN}#sqlite-database-integration/load.php#" "$WP_DIR/wp-content/db.php"
  $WP config create --dbname=wp --dbuser=x --dbpass=x --skip-check --locale=vi
  $WP core install --url="http://localhost:$PORT" --title="Nội Thất IRIS" --admin_user=admin --admin_password=admin123 --admin_email=admin@example.com --skip-email
  $WP language core install vi --activate || true
  curl -sSL -o /tmp/woo.zip https://downloads.wordpress.org/plugin/woocommerce.latest-stable.zip
  $WP plugin install /tmp/woo.zip --activate
  $WP language plugin install woocommerce vi || true
  ln -sfn "$ROOT/iris" "$WP_DIR/wp-content/themes/iris"
  $WP theme activate iris
  $WP iris import-demo
fi

echo ""
echo "WordPress: http://localhost:$PORT   (quản trị: /wp-admin – admin / admin123)"
echo "Dừng: Ctrl+C"
php -S "localhost:$PORT" -t "$WP_DIR" "$ROOT/tools/router.php"

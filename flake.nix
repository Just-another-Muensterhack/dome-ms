{
  description = "dome.ms backend and web";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";

    pyproject-nix = {
      url = "github:pyproject-nix/pyproject.nix";
      inputs.nixpkgs.follows = "nixpkgs";
    };

    uv2nix = {
      url = "github:pyproject-nix/uv2nix";
      inputs.pyproject-nix.follows = "pyproject-nix";
      inputs.nixpkgs.follows = "nixpkgs";
    };

    pyproject-build-systems = {
      url = "github:pyproject-nix/build-system-pkgs";
      inputs.pyproject-nix.follows = "pyproject-nix";
      inputs.uv2nix.follows = "uv2nix";
      inputs.nixpkgs.follows = "nixpkgs";
    };
  };

  outputs =
    {
      self,
      nixpkgs,
      pyproject-nix,
      uv2nix,
      pyproject-build-systems,
      ...
    }:
    let
      inherit (nixpkgs) lib;

      systems = [
        "x86_64-linux"
        "aarch64-linux"
        "x86_64-darwin"
        "aarch64-darwin"
      ];
      forAllSystems = f: lib.genAttrs systems (system: f nixpkgs.legacyPackages.${system});

      workspace = uv2nix.lib.workspace.loadWorkspace { workspaceRoot = ./service; };

      overlay = workspace.mkPyprojectOverlay {
        sourcePreference = "wheel";
      };

      pythonSets = forAllSystems (
        pkgs:
        (pkgs.callPackage pyproject-nix.build.packages {
          python = pkgs.python314;
        }).overrideScope
          (
            lib.composeManyExtensions [
              pyproject-build-systems.overlays.default
              overlay
            ]
          )
      );

      mkDevScripts =
        pkgs:
        let
          bootstrap = ''
            repo_root() {
              if [[ -n "''${MSDOME_ROOT:-}" && -f "''${MSDOME_ROOT}/flake.nix" ]]; then
                printf '%s\n' "$MSDOME_ROOT"
                return
              fi
              local dir
              dir="$(pwd)"
              while [[ "$dir" != "/" ]]; do
                if [[ -f "$dir/flake.nix" ]]; then
                  printf '%s\n' "$dir"
                  return
                fi
                dir="$(dirname "$dir")"
              done
              echo "Could not find the MSDome repository root (flake.nix)." >&2
              exit 1
            }

            compose() {
              if command -v docker >/dev/null 2>&1 && docker compose version >/dev/null 2>&1; then
                docker compose "$@"
              else
                docker-compose "$@"
              fi
            }

            MSDOME_ROOT="$(repo_root)"
            export MSDOME_ROOT
            export COMPOSE_FILE="$MSDOME_ROOT/nix/docker-compose.yml"
            export COMPOSE_PROJECT_NAME="''${COMPOSE_PROJECT_NAME:-dome-ms-dev}"
            export KEYCLOAK_IMPORT="''${KEYCLOAK_IMPORT:-$MSDOME_ROOT/.devcontainer/keycloak}"
            export POSTGRES_HOST="''${POSTGRES_HOST:-127.0.0.1}"
            export POSTGRES_PORT="''${POSTGRES_PORT:-5432}"
            export POSTGRES_USER="''${POSTGRES_USER:-msdome}"
            export POSTGRES_PASSWORD="''${POSTGRES_PASSWORD:-msdome}"
            export POSTGRES_DB="''${POSTGRES_DB:-msdome}"
            export KEYCLOAK_URL="''${KEYCLOAK_URL:-http://127.0.0.1:8080}"
            export KEYCLOAK_PUBLIC_URL="''${KEYCLOAK_PUBLIC_URL:-http://localhost:8080}"
            export KEYCLOAK_REALM="''${KEYCLOAK_REALM:-msdome}"
            export KEYCLOAK_CLIENT_ID="''${KEYCLOAK_CLIENT_ID:-msdome-backend}"
            export KEYCLOAK_CLIENT_SECRET="''${KEYCLOAK_CLIENT_SECRET:-msdome-secret}"
            export PYTHONPATH="$MSDOME_ROOT/service/src/ms_dome"
            export DJANGO_SETTINGS_MODULE="ms_dome.settings"
            export NEXT_PUBLIC_API_ORIGIN="''${NEXT_PUBLIC_API_ORIGIN:-http://localhost:8000}"
            export NEXT_PUBLIC_KEYCLOAK_URL="''${NEXT_PUBLIC_KEYCLOAK_URL:-http://localhost:8080}"
            export NEXT_PUBLIC_KEYCLOAK_REALM="''${NEXT_PUBLIC_KEYCLOAK_REALM:-msdome}"
            export NEXT_PUBLIC_KEYCLOAK_CLIENT_ID="''${NEXT_PUBLIC_KEYCLOAK_CLIENT_ID:-frontend-client}"
          '';
        in
        rec {
          run-dev-infra = pkgs.writeShellApplication {
            name = "run-dev-infra";
            runtimeInputs = [
              pkgs.curl
              pkgs.docker-client
              pkgs.docker-compose
            ];
            text = ''
              ${bootstrap}
              case "''${1:-}" in
                --down)
                  compose -f "$COMPOSE_FILE" --project-directory "$MSDOME_ROOT" down
                  ;;
                --foreground)
                  compose -f "$COMPOSE_FILE" --project-directory "$MSDOME_ROOT" up
                  ;;
                *)
                  compose -f "$COMPOSE_FILE" --project-directory "$MSDOME_ROOT" up -d
                  ;;
              esac
            '';
          };

          run-dev-backend = pkgs.writeShellApplication {
            name = "run-dev-backend";
            runtimeInputs = [
              pkgs.coreutils
              pkgs.curl
              pkgs.postgresql
              pkgs.python314
              pkgs.uv
            ];
            text = ''
              ${bootstrap}
              echo "Waiting for Postgres on ''${POSTGRES_HOST}:''${POSTGRES_PORT}..."
              tries=0
              while ! pg_isready -h "$POSTGRES_HOST" -p "$POSTGRES_PORT" -U "$POSTGRES_USER" >/dev/null 2>&1; do
                tries=$((tries + 1))
                if [ "$tries" -gt 60 ]; then
                  echo "Timed out waiting for Postgres." >&2
                  exit 1
                fi
                sleep 2
              done

              echo "Waiting for Keycloak realm ''${KEYCLOAK_REALM}..."
              tries=0
              while ! curl -sf "''${KEYCLOAK_URL}/realms/''${KEYCLOAK_REALM}" >/dev/null; do
                tries=$((tries + 1))
                if [ "$tries" -gt 60 ]; then
                  echo "Timed out waiting for Keycloak." >&2
                  exit 1
                fi
                sleep 2
              done
              curl -sf "''${KEYCLOAK_URL}/realms/''${KEYCLOAK_REALM}" >/dev/null

              cd "$MSDOME_ROOT/service"
              uv sync --all-groups
              uv run python src/ms_dome/manage.py migrate --noinput
              uv run python src/ms_dome/manage.py sync_nginx
              exec uv run gunicorn ms_dome.wsgi:application --bind "0.0.0.0:${"PORT:-8000"}" --workers "${GUNICORN_WORKERS: -4}" --timeout "${GUNICORN_TIMEOUT: -330}"
            '';
          };

          run-dev-frontend = pkgs.writeShellApplication {
            name = "run-dev-frontend";
            runtimeInputs = [
              pkgs.nodejs_22
            ];
            text = ''
              ${bootstrap}
              cd "$MSDOME_ROOT/web"
              npm install
              exec npm run dev -- --hostname 0.0.0.0 --port 3000
            '';
          };

          run-dev-all = pkgs.writeShellApplication {
            name = "run-dev-all";
            runtimeInputs = [
              pkgs.coreutils
              run-dev-backend
              run-dev-frontend
              run-dev-infra
            ];
            text = ''
              ${bootstrap}
              run-dev-infra
              run-dev-backend &
              backend_pid=$!
              run-dev-frontend &
              frontend_pid=$!

              cleanup() {
                trap - EXIT INT TERM
                kill "$backend_pid" "$frontend_pid" 2>/dev/null || true
                wait "$backend_pid" "$frontend_pid" 2>/dev/null || true
                run-dev-infra --down
              }
              trap cleanup EXIT INT TERM
              wait "$backend_pid" "$frontend_pid"
            '';
          };
        };
    in
    {
      packages = forAllSystems (
        pkgs:
        let
          pythonSet = pythonSets.${pkgs.stdenv.hostPlatform.system};
          venv = pythonSet.mkVirtualEnv "ms-dome-env" workspace.deps.default;
          scripts = mkDevScripts pkgs;

          ms-dome = pkgs.stdenvNoCC.mkDerivation {
            pname = "ms-dome";
            version = "0.0.1";

            src = ./service/src/ms_dome;

            nativeBuildInputs = [ pkgs.makeWrapper ];

            installPhase = ''
              runHook preInstall

              mkdir -p $out/share/ms-dome $out/bin
              cp -r . $out/share/ms-dome/

              makeWrapper ${venv}/bin/python $out/bin/ms-dome-manage \
                --add-flags "$out/share/ms-dome/manage.py" \
                --set PYTHONPATH "$out/share/ms-dome" \
                --set PYTHONDONTWRITEBYTECODE 1 \
                --set PYTHONUNBUFFERED 1 \
                --set DJANGO_SETTINGS_MODULE ms_dome.settings

              cat > $out/bin/ms-dome <<EOF
              #!${pkgs.runtimeShell}
              set -e
              $out/bin/ms-dome-manage migrate --noinput
              $out/bin/ms-dome-manage sync_nginx
              export PYTHONPATH="$out/share/ms-dome" PYTHONUNBUFFERED=1 DJANGO_SETTINGS_MODULE=ms_dome.settings
              exec ${venv}/bin/gunicorn ms_dome.wsgi:application \\
                --chdir "$out/share/ms-dome" \\
                --bind "0.0.0.0:\''${PORT:-8000}" \\
                --workers "\''${GUNICORN_WORKERS:-4}" \\
                --timeout "\''${GUNICORN_TIMEOUT:-330}" \\
                "\$@"
              EOF
              chmod +x $out/bin/ms-dome

              runHook postInstall
            '';

            passthru = {
              inherit venv;
            };

            meta = {
              description = "Backend for dome.ms";
              homepage = "https://github.com/Just-another-Muensterhack/dome.ms";
              license = lib.licenses.mit;
              mainProgram = "ms-dome";
            };
          };

          webSrc = lib.cleanSourceWith {
            src = ./web;
            filter =
              path: _type:
              let
                base = baseNameOf path;
              in
              base != "node_modules" && base != "build" && base != "out" && base != ".next";
          };

          ms-dome-web = pkgs.buildNpmPackage {
            pname = "ms-dome-web";
            version = "0.1.0";
            src = webSrc;
            npmDepsHash = "sha256-h0yOtZXTt5lPbBE3nGhHaS5MD0FD+UqsKd1czmLDBoM=";
            env = {
              NEXT_TELEMETRY_DISABLED = "1";
              NEXT_PUBLIC_API_ORIGIN = "http://localhost:8000";
              NEXT_PUBLIC_KEYCLOAK_URL = "http://localhost:8080";
              NEXT_PUBLIC_KEYCLOAK_REALM = "msdome";
              NEXT_PUBLIC_KEYCLOAK_CLIENT_ID = "frontend-client";
            };
            npmBuildScript = "build";
            installPhase = ''
              runHook preInstall
              mkdir -p $out/share/ms-dome-web
              if [ -d out ]; then
                cp -r out/. $out/share/ms-dome-web/
              else
                cp -r build/. $out/share/ms-dome-web/
              fi
              runHook postInstall
            '';
            meta = {
              description = "dome.ms web frontend";
              homepage = "https://github.com/Just-another-Muensterhack/dome.ms";
              license = lib.licenses.mit;
            };
          };

          mkDockerImage =
            {
              name,
              tag ? "latest",
              contents ? [ ],
              extraFakeRoot ? "",
              config,
            }:
            pkgs.dockerTools.buildLayeredImage {
              inherit name tag config;
              contents = [
                pkgs.dockerTools.caCertificates
              ]
              ++ contents;
              fakeRootCommands = extraFakeRoot;
            };

          webNginxConf = pkgs.writeText "nginx.conf" ''
            worker_processes 1;
            error_log /dev/stderr info;
            pid /tmp/nginx.pid;
            events {
              worker_connections 1024;
            }
            http {
              include ${pkgs.nginx}/conf/mime.types;
              default_type application/octet-stream;
              access_log /dev/stdout;
              sendfile on;
              server {
                listen 3000;
                server_name _;
                root ${ms-dome-web}/share/ms-dome-web;
                index index.html;
                location /_next/ {
                  try_files $uri =404;
                }
                location / {
                  add_header Cache-Control "no-cache";
                  try_files $uri $uri.html $uri/ /index.html;
                }
              }
            }
          '';
        in
        {
          inherit
            ms-dome
            ms-dome-web
            ;
          default = ms-dome;
        }
        // scripts
        // lib.optionalAttrs pkgs.stdenv.hostPlatform.isLinux rec {
          docker-backend = docker;
          docker = mkDockerImage {
            name = "ms-dome";
            contents = [
              (pkgs.dockerTools.fakeNss.override {
                extraPasswdLines = [ "app:x:999:999:app:/home/app:/bin/false" ];
                extraGroupLines = [ "app:x:999:" ];
              })
            ];
            extraFakeRoot = ''
              mkdir -p ./home/app ./tmp
              chown 999:999 ./home/app
              chmod 1777 ./tmp
            '';
            config = {
              Cmd = [ (lib.getExe ms-dome) ];
              User = "app";
              WorkingDir = "/home/app";
              ExposedPorts."8000/tcp" = { };
              Env = [
                "HOME=/home/app"
                "PYTHONDONTWRITEBYTECODE=1"
                "PYTHONUNBUFFERED=1"
                "DJANGO_ALLOWED_HOSTS=*"
                "DJANGO_DEBUG=false"
              ];
            };
          };

          docker-web = mkDockerImage {
            name = "ms-dome-web";
            contents = [
              pkgs.nginx
              (pkgs.dockerTools.fakeNss.override {
                extraPasswdLines = [ "app:x:999:999:app:/home/app:/bin/false" ];
                extraGroupLines = [ "app:x:999:" ];
              })
            ];
            extraFakeRoot = ''
              mkdir -p ./tmp ./var/log/nginx ./var/cache/nginx ./run
              chmod 1777 ./tmp ./var/log/nginx ./var/cache/nginx ./run
            '';
            config = {
              Cmd = [
                "${pkgs.nginx}/bin/nginx"
                "-c"
                "${webNginxConf}"
                "-g"
                "daemon off;"
              ];
              ExposedPorts."3000/tcp" = { };
            };
          };

        }
      );

      apps = forAllSystems (
        pkgs:
        let
          system = pkgs.stdenv.hostPlatform.system;
          pkg = self.packages.${system}.ms-dome;
          scripts = mkDevScripts pkgs;
        in
        {
          default = {
            type = "app";
            program = lib.getExe pkg;
          };
          manage = {
            type = "app";
            program = "${pkg}/bin/ms-dome-manage";
          };
          run-dev-all = {
            type = "app";
            program = lib.getExe scripts.run-dev-all;
          };
          run-dev-infra = {
            type = "app";
            program = lib.getExe scripts.run-dev-infra;
          };
          run-dev-backend = {
            type = "app";
            program = lib.getExe scripts.run-dev-backend;
          };
          run-dev-frontend = {
            type = "app";
            program = lib.getExe scripts.run-dev-frontend;
          };
        }
      );

      devShells = forAllSystems (
        pkgs:
        let
          scripts = mkDevScripts pkgs;
        in
        {
          default = pkgs.mkShell {
            packages = [
              pkgs.python314
              pkgs.uv
              pkgs.nodejs_22
              pkgs.postgresql
              pkgs.curl
              pkgs.jq
              pkgs.git
              pkgs.docker-client
              pkgs.docker-compose
              scripts.run-dev-all
              scripts.run-dev-infra
              scripts.run-dev-backend
              scripts.run-dev-frontend
            ];
            env = {
              UV_PYTHON_DOWNLOADS = "never";
              UV_PYTHON = pkgs.python314.interpreter;
              NEXT_TELEMETRY_DISABLED = "1";
            };
            shellHook = ''
              unset PYTHONPATH
              if [[ -f flake.nix ]]; then
                export MSDOME_ROOT="$PWD"
              fi
              echo "dome.ms nix develop"
              echo "  run-dev-all       Keycloak + Postgres + backend + frontend"
              echo "  run-dev-infra     Keycloak (msdome realm) + Postgres containers"
              echo "  run-dev-backend   Django on :8000"
              echo "  run-dev-frontend  Next.js on :3000"
            '';
          };
        }
      );

      formatter = forAllSystems (pkgs: pkgs.nixfmt-rfc-style);
    };
}

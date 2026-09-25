{
  description = "Backend for MSDome";

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

      # Resolve dependencies from uv.lock.
      workspace = uv2nix.lib.workspace.loadWorkspace { workspaceRoot = ./.; };

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
    in
    {
      packages = forAllSystems (
        pkgs:
        let
          pythonSet = pythonSets.${pkgs.stdenv.hostPlatform.system};

          # The project is a virtual uv project, so the venv only holds the
          # runtime dependencies; the Django sources are shipped separately.
          venv = pythonSet.mkVirtualEnv "ms-dome-env" workspace.deps.default;

          ms-dome = pkgs.stdenvNoCC.mkDerivation {
            pname = "ms-dome";
            version = "0.0.1";

            src = ./src/ms_dome;

            nativeBuildInputs = [ pkgs.makeWrapper ];

            installPhase = ''
              runHook preInstall

              mkdir -p $out/share/ms-dome $out/bin
              cp -r . $out/share/ms-dome/

              makeWrapper ${venv}/bin/python $out/bin/ms-dome-manage \
                --add-flags "$out/share/ms-dome/manage.py" \
                --set PYTHONPATH "$out/share/ms-dome" \
                --set PYTHONDONTWRITEBYTECODE 1 \
                --set PYTHONUNBUFFERED 1

              # Mirrors docker/start.sh: migrate, then serve with gunicorn.
              cat > $out/bin/ms-dome <<EOF
              #!${pkgs.runtimeShell}
              set -e
              $out/bin/ms-dome-manage migrate --noinput
              export PYTHONPATH="$out/share/ms-dome" PYTHONUNBUFFERED=1
              exec ${venv}/bin/gunicorn ms_dome.wsgi:application \\
                --chdir "$out/share/ms-dome" \\
                --bind "0.0.0.0:\''${PORT:-8000}" \\
                --workers "\''${GUNICORN_WORKERS:-4}" \\
                "\$@"
              EOF
              chmod +x $out/bin/ms-dome

              runHook postInstall
            '';

            passthru = { inherit venv; };

            meta = {
              description = "Backend for MSDome";
              homepage = "https://github.com/Just-another-Muensterhack/dome-ms-backend";
              license = lib.licenses.mit;
              mainProgram = "ms-dome";
            };
          };
        in
        {
          inherit ms-dome;
          default = ms-dome;
        }
        // lib.optionalAttrs pkgs.stdenv.hostPlatform.isLinux {
          # Nix equivalent of the Dockerfile: `nix build .#docker && docker load < result`
          docker = pkgs.dockerTools.buildLayeredImage {
            name = "ms-dome";
            tag = "latest";

            contents = [
              pkgs.dockerTools.caCertificates
              (pkgs.dockerTools.fakeNss.override {
                extraPasswdLines = [ "app:x:999:999:app:/home/app:/bin/false" ];
                extraGroupLines = [ "app:x:999:" ];
              })
            ];

            # gunicorn needs a writable $HOME (control socket) and /tmp.
            fakeRootCommands = ''
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
              ];
            };
          };
        }
      );

      apps = forAllSystems (
        pkgs:
        let
          pkg = self.packages.${pkgs.stdenv.hostPlatform.system}.ms-dome;
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
        }
      );

      devShells = forAllSystems (pkgs: {
        default = pkgs.mkShell {
          packages = [
            pkgs.python314
            pkgs.uv
            pkgs.postgresql
          ];
          env = {
            UV_PYTHON_DOWNLOADS = "never";
            UV_PYTHON = pkgs.python314.interpreter;
          };
          shellHook = ''
            unset PYTHONPATH
          '';
        };
      });

      formatter = forAllSystems (pkgs: pkgs.nixfmt-rfc-style);
    };
}

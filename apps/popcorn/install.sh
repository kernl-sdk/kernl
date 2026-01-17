#!/usr/bin/env bash
set -euo pipefail

APP=popcorn
REPO="kernl-sdk/kernl"

MUTED='\033[0;2m'
RED='\033[0;31m'
ORANGE='\033[38;5;214m'
NC='\033[0m'

usage() {
    cat <<EOF
Popcorn Installer

Usage: install.sh [options]

Options:
    -h, --help              Display this help message
    -v, --version <version> Install a specific version (e.g., 1.0.0)
    -b, --binary <path>     Install from a local binary instead of downloading
        --no-modify-path    Don't modify shell config files (.zshrc, .bashrc, etc.)

Examples:
    curl -fsSL https://kernl.sh/popcorn/install | bash
    curl -fsSL https://kernl.sh/popcorn/install | bash -s -- --version 1.0.0
    ./install.sh --binary /path/to/popcorn
EOF
}

requested_version=${VERSION:-}
no_modify_path=false
binary_path=""

while [[ $# -gt 0 ]]; do
    case "$1" in
        -h|--help)
            usage
            exit 0
            ;;
        -v|--version)
            if [[ -n "${2:-}" ]]; then
                requested_version="$2"
                shift 2
            else
                echo -e "${RED}Error: --version requires a version argument${NC}"
                exit 1
            fi
            ;;
        -b|--binary)
            if [[ -n "${2:-}" ]]; then
                binary_path="$2"
                shift 2
            else
                echo -e "${RED}Error: --binary requires a path argument${NC}"
                exit 1
            fi
            ;;
        --no-modify-path)
            no_modify_path=true
            shift
            ;;
        *)
            echo -e "${ORANGE}Warning: Unknown option '$1'${NC}" >&2
            shift
            ;;
    esac
done

INSTALL_DIR=$HOME/.popcorn/bin
mkdir -p "$INSTALL_DIR"

if [ -n "$binary_path" ]; then
    if [ ! -f "$binary_path" ]; then
        echo -e "${RED}Error: Binary not found at ${binary_path}${NC}"
        exit 1
    fi
    specific_version="local"
else
    raw_os=$(uname -s)
    os=$(echo "$raw_os" | tr '[:upper:]' '[:lower:]')
    case "$raw_os" in
        Darwin*) os="darwin" ;;
        Linux*) os="linux" ;;
    esac

    arch=$(uname -m)
    case "$arch" in
        aarch64) arch="arm64" ;;
        x86_64) arch="x64" ;;
    esac

    # Detect Rosetta on macOS
    if [ "$os" = "darwin" ] && [ "$arch" = "x64" ]; then
        rosetta_flag=$(sysctl -n sysctl.proc_translated 2>/dev/null || echo 0)
        if [ "$rosetta_flag" = "1" ]; then
            arch="arm64"
        fi
    fi

    combo="$os-$arch"
    case "$combo" in
        linux-x64|linux-arm64|darwin-x64|darwin-arm64)
            ;;
        *)
            echo -e "${RED}Unsupported OS/Arch: $os/$arch${NC}"
            exit 1
            ;;
    esac

    # Linux uses tar.gz, macOS uses zip
    if [ "$os" = "linux" ]; then
        archive_ext=".tar.gz"
        if ! command -v tar >/dev/null 2>&1; then
            echo -e "${RED}Error: 'tar' is required but not installed.${NC}"
            exit 1
        fi
    else
        archive_ext=".zip"
        if ! command -v unzip >/dev/null 2>&1; then
            echo -e "${RED}Error: 'unzip' is required but not installed.${NC}"
            exit 1
        fi
    fi

    target="$os-$arch"
    filename="$APP-$target$archive_ext"

    if [ -z "$requested_version" ]; then
        url="https://github.com/$REPO/releases/latest/download/$filename"
        specific_version=$(curl -s "https://api.github.com/repos/$REPO/releases/latest" | sed -n 's/.*"tag_name": *"v\([^"]*\)".*/\1/p')

        if [[ $? -ne 0 || -z "$specific_version" ]]; then
            echo -e "${RED}Failed to fetch version information${NC}"
            exit 1
        fi
    else
        requested_version="${requested_version#v}"
        url="https://github.com/$REPO/releases/download/v${requested_version}/$filename"
        specific_version=$requested_version

        http_status=$(curl -sI -o /dev/null -w "%{http_code}" "https://github.com/$REPO/releases/tag/v${requested_version}")
        if [ "$http_status" = "404" ]; then
            echo -e "${RED}Error: Release v${requested_version} not found${NC}"
            echo -e "${MUTED}Available releases: https://github.com/$REPO/releases${NC}"
            exit 1
        fi
    fi
fi

print_message() {
    local level=$1
    local message=$2
    local color=""

    case $level in
        info) color="${NC}" ;;
        warning) color="${ORANGE}" ;;
        error) color="${RED}" ;;
    esac

    echo -e "${color}${message}${NC}"
}

check_version() {
    if command -v popcorn >/dev/null 2>&1; then
        installed_version=$(popcorn --version 2>/dev/null || echo "")

        if [[ "$installed_version" != "$specific_version" ]]; then
            print_message info "${MUTED}Installed version: ${NC}$installed_version"
        else
            print_message info "${MUTED}Version ${NC}$specific_version${MUTED} already installed${NC}"
            exit 0
        fi
    fi
}

download_and_install() {
    print_message info "\n${MUTED}Installing ${NC}popcorn ${MUTED}version: ${NC}$specific_version"

    local tmp_dir="${TMPDIR:-/tmp}/popcorn_install_$$"
    mkdir -p "$tmp_dir"

    echo -e "${MUTED}Downloading...${NC}"
    curl -# -L -o "$tmp_dir/$filename" "$url"

    if [ "$os" = "linux" ]; then
        tar -xzf "$tmp_dir/$filename" -C "$tmp_dir"
    else
        unzip -q "$tmp_dir/$filename" -d "$tmp_dir"
    fi

    mv "$tmp_dir/popcorn" "$INSTALL_DIR"
    chmod 755 "${INSTALL_DIR}/popcorn"
    rm -rf "$tmp_dir"
}

install_from_binary() {
    print_message info "\n${MUTED}Installing ${NC}popcorn ${MUTED}from: ${NC}$binary_path"
    cp "$binary_path" "${INSTALL_DIR}/popcorn"
    chmod 755 "${INSTALL_DIR}/popcorn"
}

if [ -n "$binary_path" ]; then
    install_from_binary
else
    check_version
    download_and_install
fi

add_to_path() {
    local config_file=$1
    local command=$2

    if grep -Fxq "$command" "$config_file" 2>/dev/null; then
        print_message info "${MUTED}PATH already configured in ${NC}$config_file"
    elif [[ -w $config_file ]]; then
        echo -e "\n# popcorn" >> "$config_file"
        echo "$command" >> "$config_file"
        print_message info "${MUTED}Added to PATH in ${NC}$config_file"
    else
        print_message warning "Manually add to $config_file:"
        print_message info "  $command"
    fi
}

if [[ "$no_modify_path" != "true" ]]; then
    XDG_CONFIG_HOME=${XDG_CONFIG_HOME:-$HOME/.config}
    current_shell=$(basename "$SHELL")

    case $current_shell in
        fish)
            config_files="$HOME/.config/fish/config.fish"
            ;;
        zsh)
            config_files="${ZDOTDIR:-$HOME}/.zshrc ${ZDOTDIR:-$HOME}/.zshenv $XDG_CONFIG_HOME/zsh/.zshrc $XDG_CONFIG_HOME/zsh/.zshenv"
            ;;
        bash)
            config_files="$HOME/.bashrc $HOME/.bash_profile $HOME/.profile $XDG_CONFIG_HOME/bash/.bashrc $XDG_CONFIG_HOME/bash/.bash_profile"
            ;;
        ash|sh)
            config_files="$HOME/.ashrc $HOME/.profile /etc/profile"
            ;;
        *)
            config_files="$HOME/.bashrc $HOME/.bash_profile $XDG_CONFIG_HOME/bash/.bashrc $XDG_CONFIG_HOME/bash/.bash_profile"
            ;;
    esac

    config_file=""
    for file in $config_files; do
        if [[ -f $file ]]; then
            config_file=$file
            break
        fi
    done

    if [[ -z $config_file ]]; then
        print_message warning "No config file found for $current_shell. Manually add to PATH:"
        print_message info "  export PATH=$INSTALL_DIR:\$PATH"
    elif [[ ":$PATH:" != *":$INSTALL_DIR:"* ]]; then
        case $current_shell in
            fish)
                add_to_path "$config_file" "fish_add_path $INSTALL_DIR"
                ;;
            *)
                add_to_path "$config_file" "export PATH=$INSTALL_DIR:\$PATH"
                ;;
        esac
    fi
fi

if [ -n "${GITHUB_ACTIONS-}" ] && [ "${GITHUB_ACTIONS}" == "true" ]; then
    echo "$INSTALL_DIR" >> "$GITHUB_PATH"
    print_message info "Added $INSTALL_DIR to \$GITHUB_PATH"
fi

echo ""
echo -e "${MUTED}Popcorn installed successfully!${NC}"
echo ""
echo -e "To get started:"
echo ""
echo -e "  cd <project>  ${MUTED}# Open a project directory${NC}"
echo -e "  popcorn       ${MUTED}# Start popcorn${NC}"
echo ""

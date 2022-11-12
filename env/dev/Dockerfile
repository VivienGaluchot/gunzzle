FROM debian:11

# add dev tools
RUN apt-get update && \
    apt-get install git vim sudo bash-completion wget -y

# add dev user
RUN useradd -m dev && echo "dev:dev" | chpasswd && adduser dev sudo
USER dev
WORKDIR /home/dev

# prepare .ssh directory for github access
RUN mkdir -p /home/dev/.ssh
RUN chown -R dev:dev /home/dev/.ssh

# install NodeJs
RUN wget -qO- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.2/install.sh | bash
SHELL ["/bin/bash", "--login", "-c"] 
RUN nvm install 18 && nvm alias default && nvm install-latest-npm
RUN node -v

ENTRYPOINT ["bash"]

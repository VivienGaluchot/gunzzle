FROM denoland/deno:debian-1.41.0

# add dev tools
RUN apt-get update && \
    apt-get install git vim sudo bash-completion wget make -y

# add dev user
RUN adduser --disabled-password --gecos '' dev && adduser dev sudo
USER dev
WORKDIR /home/dev
RUN echo "alias ll='ls -l'" >> .bashrc

ENTRYPOINT ["bash"]

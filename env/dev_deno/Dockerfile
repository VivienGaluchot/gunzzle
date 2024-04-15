FROM debian:12.5

# add dev tools
RUN apt-get update && \
    apt-get install git vim sudo bash-completion make curl unzip -y

# add dev user
RUN adduser --disabled-password --gecos '' dev && adduser dev sudo
USER dev
WORKDIR /home/dev
RUN echo "alias ll='ls -l'" >> .bashrc

# install deno
RUN curl -fsSL https://deno.land/install.sh | sh
ENV PATH="$PATH:/home/dev/.deno/bin"

ENTRYPOINT ["bash"]

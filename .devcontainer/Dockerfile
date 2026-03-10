FROM python:3.14

ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    locales \
    build-essential \
    cmake \
    lcov \
    gcovr \
    pkg-config \
    libgtest-dev \
    libgmock-dev \
    libexpat-dev \
    libcsv-dev \
    gdb \
    git \
    xmldiff \
    less \
    vim \
    sudo  && \
    cmake -S /usr/src/googletest -B /tmp/googletest-build && \
    cmake --build /tmp/googletest-build && \
    cp /tmp/googletest-build/lib/libgtest*.a /usr/local/lib/ && \
    cp /tmp/googletest-build/lib/libgmock*.a /usr/local/lib/ && \
    ln -s /usr/src/googletest/googletest/include/gtest /usr/local/include/gtest && \
    ln -s /usr/src/googletest/googlemock/include/gmock /usr/local/include/gmock && \
    ldconfig && \
    echo "en_US.UTF-8 UTF-8" > /etc/locale.gen && \
    locale-gen && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/\* /tmp/\* /var/tmp/* && \
    useradd -m docker 

ENV LANG=en_US.UTF-8
ENV LANGUAGE=en_US:en

WORKDIR /workspace

SHELL ["/bin/bash", "-c"]

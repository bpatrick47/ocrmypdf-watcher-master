FROM ubuntu:18.04

RUN apt-get update && apt-get install -y --no-install-recommends \
  ocrmypdf \
  unpaper \
  tesseract-ocr-eng \
  tesseract-ocr-fra \
  tesseract-ocr-deu \
  tesseract-ocr-spa \
  tesseract-ocr-por \
  tesseract-ocr-chi-sim \
  python3-venv \
  python3-pip \
  nodejs \
  npm \
  python3-pip

ENV LANG=C.UTF-8

RUN rm -rf /tmp/* /var/tmp/* /root/* \
  && apt-get autoremove -y \
  && apt-get autoclean -y

RUN mkdir /application

COPY . /application

WORKDIR /application

RUN npm install

CMD node src/app.js

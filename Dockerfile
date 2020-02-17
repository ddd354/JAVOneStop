# Dockerfile

# FROM directive instructing base image to build upon
FROM python:3.7.3-stretch

# Config app
WORKDIR /usr/src/app
COPY . .
RUN pip install --no-cache-dir -r requirements.txt

# Install Node js for scraper
#RUN curl -sL https://deb.nodesource.com/setup_8.x | bash -
#RUN apt-get install -y nodejs

# EXPOSE port 8000 to allow communication to/from server
EXPOSE 8009

# CMD specifcies the command to execute to start the server running.
WORKDIR /usr/src/app
CMD ["python", "-m", "JavHelper.run"]
# done!

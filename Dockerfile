# Dockerfile

# FROM directive instructing base image to build upon
FROM python:3.7.3-stretch

# Config app
WORKDIR /usr/src/app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# EXPOSE port 8000 to allow communication to/from server
EXPOSE 8009

# CMD specifcies the command to execute to start the server running.
WORKDIR /usr/src/app
COPY . .

# INIT SERVER
CMD ["python", "-m", "JavHelper.run"]
# done!

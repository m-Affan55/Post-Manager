FROM python:3.9

WORKDIR /app

RUN pip install -r requirements.txt

COPY . /app

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "[IP_ADDRESS]", "--port", "8000", "--reload"]
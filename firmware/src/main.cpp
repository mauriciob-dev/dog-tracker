#include <Arduino.h>
#include "secrets.h"

#define MODEM_TX_PIN 26
#define MODEM_RX_PIN 27
#define PWRKEY_PIN 4
#define POWERON_PIN 12
#define RESET_PIN 5

const char *APN = "internet.comcel.com.co";
const char *SERVER_URL = SECRET_SERVER_URL;
const char *API_KEY = SECRET_API_KEY;
const char *DEVICE_ID = "perro1";
const uint32_t SEND_INTERVAL_MS = 15000;

HardwareSerial SerialAT(1);

String readAT(const String &cmd, uint32_t waitMs = 2000, const char *until = "OK")
{
  while (SerialAT.available())
    SerialAT.read();
  SerialAT.println(cmd);
  String r;
  uint32_t t = millis();
  while (millis() - t < waitMs)
  {
    while (SerialAT.available())
      r += (char)SerialAT.read();
    if (r.indexOf(until) >= 0 || r.indexOf("ERROR") >= 0)
      break;
  }
  r.trim();
  Serial.printf(">> %s\n%s\n\n", cmd.c_str(), r.c_str());
  return r;
}

bool modemAlive(int tries)
{
  for (int i = 0; i < tries; i++)
  {
    if (readAT("AT", 1000).indexOf("OK") >= 0)
      return true;
    delay(500);
  }
  return false;
}

bool initModem()
{
  pinMode(POWERON_PIN, OUTPUT);
  digitalWrite(POWERON_PIN, HIGH);
  pinMode(RESET_PIN, OUTPUT);
  digitalWrite(RESET_PIN, HIGH);
  pinMode(PWRKEY_PIN, OUTPUT);
  digitalWrite(PWRKEY_PIN, LOW);
  delay(500);

  if (modemAlive(4))
    return true; // ya encendido: no tocar PWRKEY

  digitalWrite(PWRKEY_PIN, HIGH); // un solo pulso
  delay(1200);
  digitalWrite(PWRKEY_PIN, LOW);
  delay(5000);
  return modemAlive(15);
}

bool waitRegistered(uint32_t timeoutMs)
{
  uint32_t t = millis();
  while (millis() - t < timeoutMs)
  {
    String r = readAT("AT+CEREG?", 1000);
    if (r.indexOf("0,1") >= 0 || r.indexOf("0,5") >= 0)
      return true;
    delay(3000);
  }
  return false;
}

double toDecimal(const String &raw, const String &hemi)
{
  double v = raw.toDouble(); // ya viene en grados decimales
  return (hemi == "S" || hemi == "W") ? -v : v;
}

bool getFix(double &lat, double &lon, float &speed, float &hdop)
{
  String r = readAT("AT+CGNSSINFO", 2000);
  int i = r.indexOf("+CGNSSINFO:");
  if (i < 0)
    return false;
  String f = r.substring(i + 11);
  int e = f.indexOf('\r');
  if (e > 0)
    f = f.substring(0, e);
  f.trim();

  String p[20];
  int n = 0, start = 0;
  for (int k = 0; k <= (int)f.length() && n < 20; k++)
  {
    if (k == (int)f.length() || f[k] == ',')
    {
      p[n++] = f.substring(start, k);
      start = k + 1;
    }
  }
  if (n < 16 || p[5].length() < 4)
    return false;

  lat = toDecimal(p[5], p[6]);
  lon = toDecimal(p[7], p[8]);
  if (lat == 0 && lon == 0)
    return false;
  speed = p[12].toFloat();
  hdop = p[15].toFloat();
  return hdop > 0 && hdop < 5.0;
}

bool postPosition(double lat, double lon, float speed, float hdop)
{
  char body[160];
  snprintf(body, sizeof(body),
           "{\"deviceId\":\"%s\",\"lat\":%.6f,\"lon\":%.6f,\"speed\":%.1f,\"hdop\":%.1f}",
           DEVICE_ID, lat, lon, speed, hdop);

  readAT("AT+HTTPTERM", 1000);
  if (readAT("AT+HTTPINIT").indexOf("OK") < 0)
    return false;
  readAT(String("AT+HTTPPARA=\"URL\",\"") + SERVER_URL + "\"");
  readAT("AT+HTTPPARA=\"CONTENT\",\"application/json\"");
  readAT(String("AT+HTTPPARA=\"USERDATA\",\"x-api-key: ") + API_KEY + "\"");

  String d = readAT(String("AT+HTTPDATA=") + strlen(body) + ",5000", 3000, "DOWNLOAD");
  if (d.indexOf("DOWNLOAD") < 0)
  {
    readAT("AT+HTTPTERM");
    return false;
  }
  SerialAT.print(body);
  delay(1500);
  while (SerialAT.available())
    SerialAT.read();

  String r = readAT("AT+HTTPACTION=1", 20000, "+HTTPACTION:");
  readAT("AT+HTTPTERM", 1000);
  return r.indexOf(",200,") >= 0 || r.indexOf(",201,") >= 0;
}

void setup()
{
  Serial.begin(115200);
  delay(1500);
  Serial.println("\n== Rastreador Fase 1 ==\n");
  SerialAT.begin(115200, SERIAL_8N1, MODEM_RX_PIN, MODEM_TX_PIN);

  if (!initModem())
  {
    Serial.println("ERROR: modem no responde");
    return;
  }
  readAT("ATE0");
  readAT(String("AT+CGDCONT=1,\"IP\",\"") + APN + "\"");
  Serial.println(waitRegistered(90000) ? "REGISTRADO\n" : "SIN REGISTRO\n");
  readAT("AT+CGNSSPWR=1", 5000);
}

void loop()
{
  double lat, lon;
  float speed, hdop;
  if (getFix(lat, lon, speed, hdop))
  {
    Serial.printf("FIX %.6f, %.6f (HDOP %.1f)\n", lat, lon, hdop);
    Serial.println(postPosition(lat, lon, speed, hdop) ? "ENVIADO OK\n" : "ENVIO FALLO\n");
  }
  else
  {
    Serial.println("Sin fix confiable\n");
  }
  delay(SEND_INTERVAL_MS);
}
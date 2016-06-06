#include <avr/sleep.h>

int pin_i = 0;
int pin_o = 9;
int pin_spec = 13;

int unsleep_count = 0;

void trigger() {
  Serial.println("S");
  digitalWrite(pin_o, HIGH);
  delay(100);
  digitalWrite(pin_o, LOW);
}

void setup() {
  Serial.begin(9600);

  pinMode(pin_spec, OUTPUT);
  pinMode(pin_o, OUTPUT);
  digitalWrite(pin_o, LOW);
  digitalWrite(pin_spec, HIGH);

  attachInterrupt(pin_i, trigger, RISING);
}

void loop() {
  unsleep_count++;
  digitalWrite(pin_spec, HIGH);
  if (unsleep_count > 10000) {
    digitalWrite(pin_spec, LOW);
    // go to sleep
    sleep_enable();
    set_sleep_mode(SLEEP_MODE_PWR_DOWN);
    sleep_mode();
    // wake up
    sleep_disable();
    unsleep_count = 0;
  }
}

#include <avr/sleep.h>

const byte LED = 13;    // 工作指示灯
const byte PIN_OUT = 9;  // 临时用于通知旧板子有信号到了的端口

volatile bool isTrigger = false;  // 中断变量

unsigned long max_loop_count = 500000; // 在无串口通信时，大约5秒钟一次
unsigned long loop_count = 0;  // 计数

void onTrigger() {
  isTrigger = true;
}

void showInfo() {
  digitalWrite(PIN_OUT, LOW);
  delay (50);
  digitalWrite(PIN_OUT, HIGH);
}

void setup () 
{
    Serial.begin(9600);
    pinMode(LED, OUTPUT);
    pinMode(PIN_OUT, OUTPUT);
    attachInterrupt(0, onTrigger, FALLING );
    
    loop_count = 0;
    digitalWrite(PIN_OUT, HIGH);  // pull up
}

void loop () 
{ 
  digitalWrite(LED, HIGH);
  if (isTrigger) {
    cli();
    isTrigger = false;   // clear to waite for next turn; this is in none interrupt zone
    sei();
    loop_count = 0;
    showInfo(); 
    Serial.println("s");
  } else {
    if (loop_count++ >= max_loop_count) {
      digitalWrite(LED, LOW);
      // it time to sleep
      sleep_enable();
      set_sleep_mode (SLEEP_MODE_PWR_DOWN);  
      sleep_mode();
      
      loop_count = 0;  // don't forget to clear the time counter
      delay(100);     // waitting for serial port initialized
      sleep_disable();
    }
  }
}


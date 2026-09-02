/**
 * config.js
 *
 * 웹앱 기본 설정
 *
 * 주의:
 * Gemini API Key는 절대 이 파일에 넣지 않는다.
 * 이 파일은 GitHub Pages를 통해 학생들에게 공개된다.
 */

const CONFIG = {

  /**
   * Google Apps Script 웹앱 주소
   *
   * Apps Script
   * → 배포
   * → 새 배포
   * → 웹 앱
   *
   * 에서 생성된 /exec 주소를 입력한다.
   */
  API_URL:
    "https://script.google.com/macros/s/AKfycbxKPwKZriLV7CIMDPY1Cz-hUDZ08KWuFh7Wwa-aDMSOdx7U0tKJ4bJkJem84dbm8YSl/exec",


  /**
   * 학생이 입력할 수 있는 의사코드 최대 길이
   *
   * Gemini.gs의
   * GEMINI_MAX_INPUT_LENGTH와 동일하게 맞춘다.
   */
  MAX_INPUT_LENGTH:
    3000,


  /**
   * 요청 제한 시간
   *
   * 밀리초 단위.
   *
   * Gemini 응답이 지나치게 오래 걸리는 경우
   * 학생 화면에서 계속 기다리지 않도록 한다.
   */
  REQUEST_TIMEOUT:
    30000

};

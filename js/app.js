/**
 * app.js
 *
 * micro:bit 의사코드 변환 웹앱
 *
 * 역할
 *
 * 1. 학생 의사코드 입력 관리
 * 2. 글자 수 표시
 * 3. 예제 입력
 * 4. Apps Script API 호출
 * 5. AI 분석 결과 표시
 * 6. 수정할 부분 표시
 * 7. MakeCode 코드 표시
 * 8. 코드 복사
 */


/* =========================================================
   1. DOM 요소
   ========================================================= */

const pseudocodeInput =
  document.getElementById(
    "pseudocode-input"
  );


const characterCount =
  document.getElementById(
    "character-count"
  );


const convertButton =
  document.getElementById(
    "convert-button"
  );


const exampleArea =
  document.getElementById(
    "example-area"
  );


const exampleButtons =
  document.getElementById(
    "example-buttons"
  );


const loadingSection =
  document.getElementById(
    "loading-section"
  );


const summarySection =
  document.getElementById(
    "summary-section"
  );


const summaryText =
  document.getElementById(
    "summary-text"
  );


const revisionSection =
  document.getElementById(
    "revision-section"
  );


const missingInformationArea =
  document.getElementById(
    "missing-information-area"
  );


const missingInformationList =
  document.getElementById(
    "missing-information-list"
  );


const feedbackArea =
  document.getElementById(
    "feedback-area"
  );


const feedbackList =
  document.getElementById(
    "feedback-list"
  );


const unsupportedSection =
  document.getElementById(
    "unsupported-section"
  );


const unsupportedReason =
  document.getElementById(
    "unsupported-reason"
  );


const codeSection =
  document.getElementById(
    "code-section"
  );


const codeOutput =
  document.getElementById(
    "code-output"
  );


const copyButton =
  document.getElementById(
    "copy-button"
  );


const copyMessage =
  document.getElementById(
    "copy-message"
  );


const errorSection =
  document.getElementById(
    "error-section"
  );


const errorMessage =
  document.getElementById(
    "error-message"
  );


/* =========================================================
   2. 초기화
   ========================================================= */

function initializeApp() {

  validateConfig();

  setupInput();

  createExampleButtons();

  setupConvertButton();

  setupCopyButton();

  updateCharacterCount();

}


/* =========================================================
   3. 설정 검사
   ========================================================= */

function validateConfig() {

  if (
    typeof CONFIG === "undefined"
  ) {

    console.error(
      "CONFIG 객체가 없습니다."
    );

    return;
  }


  if (
    !CONFIG.API_URL ||
    CONFIG.API_URL.includes(
      "여기에_배포_ID"
    )
  ) {

    console.warn(
      "Apps Script 웹앱 URL이 아직 설정되지 않았습니다."
    );
  }

}


/* =========================================================
   4. 입력창 설정
   ========================================================= */

function setupInput() {

  pseudocodeInput.maxLength =
    CONFIG.MAX_INPUT_LENGTH;


  pseudocodeInput.addEventListener(
    "input",
    function () {

      updateCharacterCount();

    }
  );

}


/* =========================================================
   5. 글자 수
   ========================================================= */

function updateCharacterCount() {

  const length =
    pseudocodeInput.value.length;


  characterCount.textContent =
    length +
    " / " +
    CONFIG.MAX_INPUT_LENGTH;

}


/* =========================================================
   6. 예제 버튼
   ========================================================= */

function createExampleButtons() {

  if (
    typeof EXAMPLES === "undefined" ||
    !Array.isArray(EXAMPLES) ||
    EXAMPLES.length === 0
  ) {

    exampleArea.classList.add(
      "hidden"
    );

    return;
  }


  exampleButtons.innerHTML =
    "";


  EXAMPLES.forEach(
    function (example) {

      const button =
        document.createElement(
          "button"
        );


      button.type =
        "button";


      button.textContent =
        example.title;


      button.addEventListener(
        "click",
        function () {

          pseudocodeInput.value =
            example.pseudocode;


          updateCharacterCount();


          resetResultSections();


          pseudocodeInput.focus();

        }
      );


      exampleButtons.appendChild(
        button
      );

    }
  );

}


/* =========================================================
   7. 변환 버튼
   ========================================================= */

function setupConvertButton() {

  convertButton.addEventListener(
    "click",
    handleConvert
  );

}


/* =========================================================
   8. 변환 실행
   ========================================================= */

async function handleConvert() {

  const pseudocode =
    pseudocodeInput
      .value
      .trim();


  /* -------------------------------------------------------
     입력 확인
     ------------------------------------------------------- */

  if (pseudocode === "") {

    showError(
      "의사코드를 먼저 작성해 주세요."
    );


    pseudocodeInput.focus();

    return;
  }


  if (
    pseudocode.length >
    CONFIG.MAX_INPUT_LENGTH
  ) {

    showError(
      "의사코드는 " +
      CONFIG.MAX_INPUT_LENGTH +
      "자 이하로 작성해 주세요."
    );

    return;
  }


  if (
    !CONFIG.API_URL ||
    CONFIG.API_URL.includes(
      "여기에_배포_ID"
    )
  ) {

    showError(
      "웹앱 서버 주소가 설정되지 않았습니다."
    );

    return;
  }


  /* -------------------------------------------------------
     이전 결과 초기화
     ------------------------------------------------------- */

  resetResultSections();


  /* -------------------------------------------------------
     로딩 시작
     ------------------------------------------------------- */

  setLoading(
    true
  );


  try {

    const result =
      await requestConversion(
        pseudocode
      );


    handleServerResult(
      result
    );


  } catch (error) {

    console.error(
      error
    );


    showError(
      getReadableErrorMessage(
        error
      )
    );


  } finally {

    setLoading(
      false
    );

  }

}


/* =========================================================
   9. Apps Script API 요청
   ========================================================= */

async function requestConversion(
  pseudocode
) {

  const controller =
    new AbortController();


  const timeoutId =
    setTimeout(
      function () {

        controller.abort();

      },
      CONFIG.REQUEST_TIMEOUT
    );


  try {

    const response =
      await fetch(
        CONFIG.API_URL,
        {

          method:
            "POST",


          /*
           * Apps Script와 GitHub Pages 사이에서
           * 불필요한 CORS Preflight를 피하기 위해
           * application/json 대신 text/plain 사용.
           */

          headers: {

            "Content-Type":
              "text/plain;charset=utf-8"

          },


          body:
            JSON.stringify({

              pseudocode:
                pseudocode

            }),


          signal:
            controller.signal

        }
      );


    const responseText =
      await response.text();


    if (
      responseText.trim() === ""
    ) {

      throw new Error(
        "서버에서 빈 응답을 받았습니다."
      );
    }


    let data;


    try {

      data =
        JSON.parse(
          responseText
        );


    } catch (error) {

      console.error(
        "서버 원본 응답:",
        responseText
      );


      throw new Error(
        "서버 응답을 읽을 수 없습니다."
      );

    }


    return data;


  } finally {

    clearTimeout(
      timeoutId
    );

  }

}


/* =========================================================
   10. 서버 결과 처리
   ========================================================= */

function handleServerResult(
  result
) {

  if (
    !result ||
    typeof result !==
      "object"
  ) {

    showError(
      "서버 응답이 올바르지 않습니다."
    );

    return;
  }


  /* -------------------------------------------------------
     서버 자체 실패
     ------------------------------------------------------- */

  if (
    result.success === false
  ) {

    handleServerErrorResult(
      result
    );

    return;
  }


  /* -------------------------------------------------------
     AI가 이해한 내용
     ------------------------------------------------------- */

  if (
    typeof result.summary ===
      "string" &&
    result.summary.trim() !== ""
  ) {

    showSummary(
      result.summary
    );

  }


  /* =======================================================
     상태별 처리
     ======================================================= */

  switch (
    result.status
  ) {


    /* -----------------------------------------------------
       정상 코드 생성
       ----------------------------------------------------- */

    case "generated":

      showGeneratedCode(
        result.code
      );

      break;


    /* -----------------------------------------------------
       학생 수정 필요
       ----------------------------------------------------- */

    case "needs_revision":

      showRevisionResult(
        result
      );

      break;


    /* -----------------------------------------------------
       지원하지 않는 기능
       ----------------------------------------------------- */

    case "unsupported":

      showUnsupportedResult(
        result.unsupportedReason
      );

      break;


    /* -----------------------------------------------------
       그 외
       ----------------------------------------------------- */

    default:

      showError(
        "알 수 없는 응답 상태입니다."
      );

  }

}


/* =========================================================
   11. 서버 오류 처리
   ========================================================= */

function handleServerErrorResult(
  result
) {

  switch (
    result.status
  ) {


    case "validation_error":

      console.error(
        "Validator 오류:",
        result.errors
      );


      showError(
        "변환 결과를 확인하는 중 오류가 발생했습니다. 다시 시도해 주세요."
      );

      break;


    case "empty_program":

      showError(
        "변환할 프로그램이 생성되지 않았습니다. 의사코드를 확인해 주세요."
      );

      break;


    case "server_error":

      showError(
        result.message ||
        "서버에서 오류가 발생했습니다."
      );

      break;


    default:

      showError(
        result.message ||
        "의사코드를 처리하지 못했습니다."
      );

  }

}


/* =========================================================
   12. AI 요약
   ========================================================= */

function showSummary(
  summary
) {

  summaryText.textContent =
    summary;


  summarySection.classList.remove(
    "hidden"
  );

}


/* =========================================================
   13. 수정 필요
   ========================================================= */

function showRevisionResult(
  result
) {

  const missing =
    Array.isArray(
      result.missingInformation
    )
      ? result.missingInformation
      : [];


  const feedback =
    Array.isArray(
      result.feedback
    )
      ? result.feedback
      : [];


  /* -------------------------------------------------------
     빠진 정보
     ------------------------------------------------------- */

  if (
    missing.length > 0
  ) {

    fillList(
      missingInformationList,
      missing
    );


    missingInformationArea
      .classList
      .remove(
        "hidden"
      );

  }


  /* -------------------------------------------------------
     잘못 작성한 부분
     ------------------------------------------------------- */

  if (
    feedback.length > 0
  ) {

    fillList(
      feedbackList,
      feedback
    );


    feedbackArea
      .classList
      .remove(
        "hidden"
      );

  }


  revisionSection.classList.remove(
    "hidden"
  );


  scrollToSection(
    revisionSection
  );

}


/* =========================================================
   14. 목록 생성
   ========================================================= */

function fillList(
  listElement,
  items
) {

  listElement.innerHTML =
    "";


  items.forEach(
    function (item) {

      const li =
        document.createElement(
          "li"
        );


      /*
       * innerHTML이 아니라 textContent 사용.
       *
       * Gemini 응답에 HTML 문자열이 있어도
       * 실제 HTML로 실행되지 않도록 한다.
       */

      li.textContent =
        item;


      listElement.appendChild(
        li
      );

    }
  );

}


/* =========================================================
   15. 지원하지 않는 기능
   ========================================================= */

function showUnsupportedResult(
  reason
) {

  unsupportedReason.textContent =
    reason ||
    "현재 지원하는 기능으로 변환할 수 없습니다.";


  unsupportedSection.classList.remove(
    "hidden"
  );


  scrollToSection(
    unsupportedSection
  );

}


/* =========================================================
   16. 코드 생성 성공
   ========================================================= */

function showGeneratedCode(
  code
) {

  if (
    typeof code !== "string" ||
    code.trim() === ""
  ) {

    showError(
      "생성된 코드가 없습니다."
    );

    return;
  }


  /*
   * HTML 코드 실행 방지를 위해
   * textContent 사용.
   */

  codeOutput.textContent =
    code;


  codeSection.classList.remove(
    "hidden"
  );


  scrollToSection(
    codeSection
  );

}


/* =========================================================
   17. 코드 복사
   ========================================================= */

function setupCopyButton() {

  copyButton.addEventListener(
    "click",
    copyGeneratedCode
  );

}


/* =========================================================
   18. 실제 복사
   ========================================================= */

async function copyGeneratedCode() {

  const code =
    codeOutput.textContent;


  if (
    !code ||
    code.trim() === ""
  ) {

    return;
  }


  try {

    if (
      navigator.clipboard &&
      window.isSecureContext
    ) {

      await navigator.clipboard.writeText(
        code
      );

    } else {

      fallbackCopyText(
        code
      );

    }


    showCopyMessage();


  } catch (error) {

    console.error(
      "복사 실패:",
      error
    );


    try {

      fallbackCopyText(
        code
      );


      showCopyMessage();


    } catch (fallbackError) {

      showError(
        "코드를 자동으로 복사하지 못했습니다. 코드를 직접 선택하여 복사해 주세요."
      );

    }

  }

}


/* =========================================================
   19. 복사 Fallback
   ========================================================= */

function fallbackCopyText(
  text
) {

  const textarea =
    document.createElement(
      "textarea"
    );


  textarea.value =
    text;


  textarea.setAttribute(
    "readonly",
    ""
  );


  textarea.style.position =
    "absolute";


  textarea.style.left =
    "-9999px";


  document.body.appendChild(
    textarea
  );


  textarea.select();


  const success =
    document.execCommand(
      "copy"
    );


  document.body.removeChild(
    textarea
  );


  if (!success) {

    throw new Error(
      "복사 실패"
    );

  }

}


/* =========================================================
   20. 복사 완료 메시지
   ========================================================= */

function showCopyMessage() {

  copyMessage.classList.remove(
    "hidden"
  );


  setTimeout(
    function () {

      copyMessage.classList.add(
        "hidden"
      );

    },
    1800
  );

}


/* =========================================================
   21. 로딩 상태
   ========================================================= */

function setLoading(
  loading
) {

  if (loading) {

    loadingSection.classList.remove(
      "hidden"
    );


    convertButton.disabled =
      true;


    convertButton.textContent =
      "분석 중...";


  } else {

    loadingSection.classList.add(
      "hidden"
    );


    convertButton.disabled =
      false;


    convertButton.textContent =
      "변환하기";

  }

}


/* =========================================================
   22. 결과 초기화
   ========================================================= */

function resetResultSections() {

  summarySection.classList.add(
    "hidden"
  );


  revisionSection.classList.add(
    "hidden"
  );


  missingInformationArea.classList.add(
    "hidden"
  );


  feedbackArea.classList.add(
    "hidden"
  );


  unsupportedSection.classList.add(
    "hidden"
  );


  codeSection.classList.add(
    "hidden"
  );


  errorSection.classList.add(
    "hidden"
  );


  copyMessage.classList.add(
    "hidden"
  );


  summaryText.textContent =
    "";


  missingInformationList.innerHTML =
    "";


  feedbackList.innerHTML =
    "";


  unsupportedReason.textContent =
    "";


  codeOutput.textContent =
    "";


  errorMessage.textContent =
    "";

}


/* =========================================================
   23. 오류 표시
   ========================================================= */

function showError(
  message
) {

  errorMessage.textContent =
    message;


  errorSection.classList.remove(
    "hidden"
  );


  scrollToSection(
    errorSection
  );

}


/* =========================================================
   24. 사용자용 오류 문구
   ========================================================= */

function getReadableErrorMessage(
  error
) {

  if (
    error &&
    error.name ===
      "AbortError"
  ) {

    return (
      "응답 시간이 너무 오래 걸리고 있습니다. 잠시 후 다시 시도해 주세요."
    );

  }


  if (
    error &&
    typeof error.message ===
      "string"
  ) {

    if (
      error.message.includes(
        "Failed to fetch"
      )
    ) {

      return (
        "서버에 연결할 수 없습니다. 인터넷 연결 또는 서버 상태를 확인해 주세요."
      );

    }


    return error.message;

  }


  return (
    "의사코드를 처리하는 중 오류가 발생했습니다."
  );

}


/* =========================================================
   25. 결과 영역으로 이동
   ========================================================= */

function scrollToSection(
  element
) {

  /*
   * 학생이 입력 내용을 수정하는 흐름을 방해하지 않도록
   * 부드럽게 결과 영역으로만 이동한다.
   */

  element.scrollIntoView({

    behavior:
      "smooth",

    block:
      "start"

  });

}


/* =========================================================
   26. 앱 시작
   ========================================================= */

initializeApp();

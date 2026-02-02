// This file can be replaced during build by using the `fileReplacements` array.
// `ng build` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,
  HOST:'http://localhost:8082',
  // URL_API_GATEWAY:'https://butdn2x1g7.execute-api.us-east-1.amazonaws.com/stage'
  URL_API_GATEWAY:'https://rrmnpgfzii.execute-api.us-east-1.amazonaws.com/sandbox',
   // rr es apigateway de desarrollo y gdu de produccion
  URL_API_LOCAL:'http://localhost:3000/stage',

  URL_API_GENERATE_QR: 'https://7yqzt06h8g.execute-api.us-east-1.amazonaws.com/prod',
  URL_API_GENERATE_QR_API_KEY: 'BSTFcTujZl7M1HBM5HwMuqm6xZUFkTQ3W1hjhjK3',
};

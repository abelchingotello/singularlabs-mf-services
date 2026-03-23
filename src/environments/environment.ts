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

  URL_API_GENERATE_QR: 'https://54nrl2in7i.execute-api.us-east-1.amazonaws.com/dev',
  URL_API_REPROCESS: 'https://n48ne1w1vb.execute-api.us-east-1.amazonaws.com/dev',
  URL_API_GENERATE_QR_API_KEY: '36IZghAT9e4TtIbjPh6cy4T49cGaigwL6CVWudmm',
  URL_API_GENERATE_QR_USERNAME: 'qrligopay',
  URL_API_GENERATE_QR_PASSWORD: 's4]1GErSg4)*',
  URL_API_SERVICES_IDCLIENT: '81018500',
};


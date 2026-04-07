function doGet(e) {
  const page = e.parameter.p || 'Catalog';
  
  if (page === 'Register') {
    return HtmlService.createTemplateFromFile('Registro').evaluate()
      .setTitle('Registro de Usuario')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  }
  
  if (page === 'Login') {
    return HtmlService.createTemplateFromFile('Login').evaluate()
      .setTitle('Iniciar Sesión')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  }
  
  return HtmlService.createTemplateFromFile('Catalogo').evaluate()
    .setTitle('Catálogo de Productos')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

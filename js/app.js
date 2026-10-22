document.querySelectorAll('.menu a').forEach(a=>{if(a.pathname===location.pathname||a.getAttribute('href')===location.pathname.split('/').pop())a.classList.add('active')});

const hide = (...ids) => {
  ids.forEach(id => {
    document.getElementById(id).style.display = 'none';
  });
};

const reveal = (...ids) => {
  ids.forEach(id => {
    const el = document.getElementById(id);
    el.style.display = 'flex';
    window.scrollTo({
      top: el.getBoundingClientRect().top + window.scrollY,
      behavior: 'smooth'
    });
  });
};

const updateFirstChild = (id, val) => {
  const parentNode = document.getElementById(id);
  if (parentNode.hasChildNodes()) {
    const node = parentNode.childNodes[0];
    const newNode = document.createTextNode(val);
    parentNode.replaceChild(newNode, node)
  }
};

export { hide, reveal, updateFirstChild };

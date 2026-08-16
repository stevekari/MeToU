import api from './axios';

export function uploadMedia(file, kind) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('kind', kind);

  return api.post('/media/upload', formData).then((res) => res.data);
}

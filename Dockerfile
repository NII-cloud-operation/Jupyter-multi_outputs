FROM quay.io/jupyter/scipy-notebook:notebook-7.5.0

USER root

### instaill Node.js v20.x because Node.js is not installed with quay.io/jupyter/scipy-notebook
RUN apt-get update && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
  && apt-get install -y nodejs \
  && npm install -g yarn

### extensions for jupyter
COPY . /tmp/multi_outputs
RUN pip --no-cache-dir install jupyter_nbextensions_configurator \
    /tmp/multi_outputs

RUN jupyter labextension enable lc_multi_outputs

RUN jupyter nbclassic-extension install --py jupyter_nbextensions_configurator --sys-prefix && \
    jupyter nbclassic-extension enable --py jupyter_nbextensions_configurator --sys-prefix && \
    jupyter nbclassic-serverextension enable --py jupyter_nbextensions_configurator --sys-prefix && \
    jupyter nbclassic-extension install --py lc_multi_outputs --sys-prefix && \
    jupyter nbclassic-extension enable --py lc_multi_outputs --sys-prefix && \
    fix-permissions /home/$NB_USER

USER $NB_USER
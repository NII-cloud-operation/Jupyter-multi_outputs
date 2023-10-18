FROM jupyter/scipy-notebook:latest

USER root

### extensions for jupyter
COPY . /tmp/multi_outputs
RUN pip --no-cache-dir install jupyter_nbextensions_configurator \
    /tmp/multi_outputs

RUN jupyter nbclassic-extension install --py jupyter_nbextensions_configurator --sys-prefix && \
    jupyter nbclassic-extension enable --py jupyter_nbextensions_configurator --sys-prefix && \
    jupyter nbclassic-serverextension enable --py jupyter_nbextensions_configurator --sys-prefix && \
    jupyter nbclassic-extension install --py lc_multi_outputs --sys-prefix && \
    jupyter nbclassic-extension enable --py lc_multi_outputs --sys-prefix && \
    fix-permissions /home/$NB_USER

USER $NB_USER
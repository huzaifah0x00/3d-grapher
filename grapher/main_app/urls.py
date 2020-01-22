from django.urls import path
from . import views

urlpatterns = [
    path('', views.index),
    path('make_graph', views.make_graph),
]

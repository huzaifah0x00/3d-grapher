from django.shortcuts import render
from django.http import HttpResponse

# Create your views here.
def index(request):
    return render(request, 'main_app/main_app.html')

def make_graph(request):
    # if this is a POST request we need to process the form data
    if request.method == 'POST':
        # create a form instance and populate it with data from the request:
        equations = dict()
        for eq in request.POST:
            if not eq.startswith('equation'):  # skip irrelevent parameters
                continue
            else:
                equations[eq] = request.POST[eq]


        return render(request, 'main_app/graph.html', context={'equations':equations})

    else:
        return HttpResponse("404, <a href='/'>home</a>")

    return render(request, 'name.html', {'form': form})

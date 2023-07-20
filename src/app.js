import { Viewer } from './viewer.js';
import {SceneManager} from "../lib/SceneManager";

class App
{
  constructor (el)
  {
    this.el = el;
    this.viewer = null;
    this.viewerEl = null;

    if (this.viewer) this.viewer.clear();

    var parseUrlParams = function()
    {
      var urlParams = window.location.href.split('?')[1].split('=');
      var vars = {};
      vars[urlParams[0]] = urlParams[1];
      return vars;
    }

    var paramJson = parseUrlParams();
    window.projectName = paramJson.scene
    this.createViewer(paramJson);

    if (paramJson.scene)
    {
      window.model = new SceneManager(this.viewer)
    }
  }

  createViewer(paramJson)
  {
    this.viewerEl = document.createElement('div');
    this.viewerEl.classList.add('viewer');
    this.el.appendChild(this.viewerEl);
    this.viewer = new Viewer(this.viewerEl, {
      baked: paramJson['baked'],
    });
    return this.viewer;
  }
}

var app = null;
document.addEventListener('DOMContentLoaded', () => {

  app = new App(document.body);

});

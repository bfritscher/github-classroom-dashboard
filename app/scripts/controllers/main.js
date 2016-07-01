'use strict';

/**
 * @ngdoc function
 * @name githubClassroomDashboardApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the githubClassroomDashboardApp
 */
angular.module('githubClassroomDashboardApp')
  .controller('MainCtrl', function ($http, ghApi) {
    var main = this;
    main.ghApi = ghApi;

    var lookup = {};
    $http.get('/preview/lookup.json')
      .then( function(response){
        lookup = response.data;
      });

    var org = 'heg-web';
    var classroomProjectPrefix = '';
    var API = 'https://api.github.com/';
    main.assignments = JSON.parse(localStorage.getItem('assignments') || '{}');

    main.before = false;
    main.switchPreview = function() {
      main.before = !main.before;
      Object.keys(main.assignments).forEach(function(k){
        var a = main.assignments[k];
        a.before = main.before;
      });
    };

    main.refresh = function(){
      ghApi.access_token = localStorage.getItem('access_token') || window.prompt('access_token');
      localStorage.setItem('access_token', ghApi.access_token );
      $http.get(API + 'orgs/' + org + '/repos?per_page=100') //page=2&
      .then( function(response){
        //TODO: handle multipage
        response.data.filter(function(repo){
          return repo.name.indexOf('demo') === -1 ;
        }).forEach(function(repo){
          if(repo.name.indexOf(classroomProjectPrefix) === 0){
            var r = {name: repo.name};
            if(main.assignments.hasOwnProperty(repo.name)){
              r = main.assignments[repo.name];
            } else {
              main.assignments[repo.name] = r;
            }

            getCollaborators(r).then(function(){
              return checkBranches(r);
            }).then(function(){
              return checkGhPagesVendor(r);
            }).then(function(){
              return checkReleases(r);
            }).then(function(){
              return checkReadme(r);
            }).then(function(){
              return getCommits(r);
            }).then(function(){
              localStorage.setItem('assignments', JSON.stringify(main.assignments));
            });
          }
        });
      });
    };

    main.getUrls = function() {
      return 'data:text/plain;charset=utf-8,' + encodeURIComponent(Object.keys(main.assignments).reduce(function(list, key){
        return list + 'https://heg-web.github.io/' + main.assignments[key].name + '\n';
      }, ''));
    };

    main.loginToMatricule = function(login) {
      return lookup[login];
    };

    main.commitCount = function(commits, u) {
        if (commits) {
            return commits.filter(function(c){
                return (c.commit.author.name === u.login|| c.commit.author.name === u.name) && c.commit.message.indexOf('Merge') !== 0;
            }).length;
        }
        return 0;
    };

    main.getCommiterIndex = function(name) {
        if (main.commiterIndex.indexOf(name) === -1) {
            main.commiterIndex.push(name);
        }
        return main.commiterIndex.indexOf(name);
    };

    function checkBranches(r){
      r.hasMaster = false;
      r.hasGhPages = false;
      return $http.get(API + 'repos/' + org + '/' + r.name + '/branches')
          .then( function(response){
            r.branches = response.data.map( function( branch ) {
              if(branch.name === 'gh-pages'){
                r.hasGhPages = true;
              }
              if(branch.name === 'master'){
                r.hasMaster = true;
              }
              return branch.name;
            });
          });
    }

    function checkGhPagesVendor(r){
      r.hasVendor = false;
      return $http.get(API + 'repos/' + org + '/' + r.name + '/contents/scripts?ref=gh-pages')
          .then( function(response){
            for(var i=0; i < response.data.length; i++){
              if(response.data[i].name.indexOf('vendor') === 0){
                r.hasVendor = true;
                return;
              }
            }
          }, function(){
            return;
          });
    }

    function checkReleases(r){
      r.hasRelease = false;
      r.releaseSha = '';
      return $http.get(API + 'repos/' + org + '/' + r.name + '/tags')
          .then( function(response){
            r.releases = response.data.map( function( release ) {
              if(release.name === '2.0.0'){
                r.hasRelease = true;
                r.releaseSha = release.commit.sha;
              }

              return release.name;
            });
          });
    }

    function checkReadme(r){
      r.hasReadme = false;
      return $http.get(API + 'repos/' + org + '/' + r.name + '/readme')
          .then( function(response){
            r.hasReadme = response.data.name.indexOf('.md') > -1;
            r.readmeUrl = response.data.html_url;
          }, function(){
            return;
          });
    }

    function getCollaborators(r){
      return $http.get(API + 'repos/' + org + '/' + r.name + '/collaborators')
          .then( function(response){
              r.users = response.data.filter(function(c){
                return c.login !== 'bfritscher';
              }).map(function(c){
                var u = {login: c.login};
                getUser(u);
                return u;
              });
          });
    }

    function getCommitsPage(r, page){
        return $http.get(API + 'repos/' + org + '/' + r.name + '/commits?per_page=100&page=' + page)
          .then( function(response){
                r.commits = r.commits.concat(response.data);
                if(response.headers('link')){
                   console.log(response.headers('link'));
                   var match = response.headers('link').match(/page=(\d+)>; rel="(.*?)"/);
                   if (match[2] === 'next') {
                       getCommitsPage(r, match[1]);
                   }
                }
          }, function(){
            return;
          });
    }

    function getCommits(r){
        r.commits = [];
        return getCommitsPage(r, 1);
    }

    function getUser(u){
      //TODO lookup cache;
      return $http.get(API + 'users/' + u.login)
          .then( function(response){
            u.name = response.data.name;
          });
    }

  });

'use strict';

function b64DecodeUnicode(str) {
  // Going backwards: from bytestream, to percent-encoding, to original string.
  return decodeURIComponent(atob(str).split('').map(function (c) {
    return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
  }).join(''));
}

/**
 * @ngdoc function
 * @name githubClassroomDashboardApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the githubClassroomDashboardApp
 */
angular.module('githubClassroomDashboardApp')
  .controller('MainCtrl', function ($http, ghApi, $scope) {
    var main = this;
    main.ghApi = ghApi;
    main.evals = [];
    main.evalsDone = [];

    main.lookup = {};

    Papa.parse('/preview/classroom_roster.csv', {
      download: true,
      header: true,
      complete: (results) => {
        $scope.$apply(() => {
          results.data.forEach(e => {
            main.lookup[e.github_username] = e.identifier;
          })
        });
      }
    })


    var org = 'heg-web';
    var API = 'https://api.github.com/';
    main.assignments = JSON.parse(localStorage.getItem('assignments') || '{}');
    main.classroomProjectPrefix = localStorage.getItem('classroomProjectPrefix');
    main.saveProjectPrefix = function () {
      localStorage.setItem('classroomProjectPrefix', main.classroomProjectPrefix);
    };
    main.clear = function () {
      main.assignments = {};
      main.evals = [];
      main.evalsDone = [];
    };

    main.before = false;
    main.switchPreview = function () {
      main.before = !main.before;
      Object.keys(main.assignments).forEach(function (k) {
        var a = main.assignments[k];
        a.before = main.before;
      });
    };

    $scope.noBot = function (user) {
      return !user.login.includes('heg-web-bot');
    };

    main.refresh = function () {
      ghApi.access_token = localStorage.getItem('access_token') || window.prompt('access_token');
      localStorage.setItem('access_token', ghApi.access_token);
      $http.get(API + 'orgs/' + org + '/repos?per_page=100') //page=2&
        .then(function (response) {
          //TODO: handle multipage
          response.data.filter(function (repo) {
            return !(repo.name.indexOf('cfrancillon') !== -1 || repo.name.indexOf('bfritscher') !== -1);
          }).forEach(function (repo) {
            if (repo.name.indexOf(main.classroomProjectPrefix) === 0) {
              var r = { name: repo.name };
              if (main.assignments.hasOwnProperty(repo.name)) {
                r = main.assignments[repo.name];
              } else {
                main.assignments[repo.name] = r;
              }
              main.refreshAssignment(r)
            }
          });
        });
    };

    main.refreshAssignment = (r) => {
      ghApi.access_token = localStorage.getItem('access_token');
      getCollaborators(r)
      .then(function () {
        return checkBranches(r);
      }).then(function () {
        return checkGhPagesVendor(r);
      }).then(function () {
        return checkMasterSrc(r);
      }).then(function () {
        return checkReleases(r);
      }).then(function () {
        return checkReadme(r);
      }).then(function () {
        return getCommits(r);
      }).then(function () {
        return checkTitle(r);
      }).then(function () {
        return checkGHPagesStatus(r);
      })
      .then(function () {
        return searchString(r, "axios", "axios");
      })
      .then(function () {
        return searchString(r, "props", "props");
      })
      .then(function () {
        return searchString(r, "$emit", "emit");
      })
      .then(function () {
        return searchString(r, "console.log", "console");
      })
      .then(function () {
        return searchString(r, "localStorage", "localStorage");
      })
      .then(function () {
        localStorage.setItem('assignments', JSON.stringify(main.assignments));
      });
    }

    main.getUrls = function () {
      return 'data:text/plain;charset=utf-8,' + encodeURIComponent(Object.keys(main.assignments).reduce(function (list, key) {
        return list + 'https://heg-web.github.io/' + main.assignments[key].name + '\n';
      }, ''));
    };

    function searchString(r, str, key) {
      ghApi.access_token = localStorage.getItem('access_token');
      return $http.get(API + `search/code?q=${str}+in:file+extension:js+extension:vue+repo:${org}/${r.name}`)
        .then(function (response) {
          if(!r.hasOwnProperty("search")) {
            r.search = {}
          }
          r.search[key] = response.data;
        });
    }

    main.loginToMatricule = function (login) {
      return main.lookup[login];
    };

    main.commitCount = function (commits, u) {
      if (commits) {
        return commits.filter(function (c) {
          return (c.commit.author.name === u.login || c.commit.author.name === u.name) && c.commit.message.indexOf('Merge') !== 0;
        }).length;
      }
      return 0;
    };

    main.getCommiterIndex = function (name) {
      if (main.commiterIndex.indexOf(name) === -1) {
        main.commiterIndex.push(name);
      }
      return main.commiterIndex.indexOf(name);
    };

    function checkBranches(r) {
      r.hasMaster = false;
      r.hasMain = false;
      r.hasGhPages = false;
      return $http.get(API + 'repos/' + org + '/' + r.name + '/branches')
        .then(function (response) {
          r.branches = response.data.map(function (branch) {
            if (branch.name === 'gh-pages') {
              r.hasGhPages = true;
            }
            if (branch.name === 'main') {
              r.hasMain = true;
            }
            if (branch.name === 'master') {
              r.hasMaster = true;
            }
            return branch.name;
          });
        });
    }

    function checkGhPagesVendor(r) {
      r.hasVendor = false;
      return $http.get(API + 'repos/' + org + '/' + r.name + '/contents/js?ref=gh-pages')
        .then(function (response) {
          for (var i = 0; i < response.data.length; i++) {
            if (response.data[i].name.indexOf('app') === 0) {
              r.hasVendor = true;
              return;
            }
          }
        }, function () {
          return;
        });
    }

    function checkMasterSrc(r) {
      r.isMasterSrc = false;
      return $http.get(API + 'repos/' + org + '/' + r.name + '/contents/?ref=' + (r.hasMain ? 'main' : 'master'))
        .then(function (response) {
          for (var i = 0; i < response.data.length; i++) {
            if (response.data[i].name.indexOf('package.json') === 0) {
              r.isMasterSrc = true;
              return;
            }
          }
        }, function () {
          return;
        });
    }

    function checkTitle(r) {
      r.title = false;
      return $http.get(API + 'repos/' + org + '/' + r.name + '/contents/index.html?ref=gh-pages')
        .then(function (response) {
          var regexTitle = /title>(.*?)<\/title/gm;
          var regexStyle = /style="[^w](.*?)"/gm;
          var html = b64DecodeUnicode(response.data.content);
          var match = regexTitle.exec(html);
          if (match) {
            r.title = match[1];
          }
          match = regexStyle.exec(html);
          if (match) {
            r.style = match[1];
          } else {
            r.style = '';
          }
        }, function () {
          return;
        });
    }

    function checkReleases(r) {
      r.hasRelease = false;
      r.releaseSha = '';
      return $http.get(API + 'repos/' + org + '/' + r.name + '/tags')
        .then(function (response) {
          r.releases = response.data.map(function (release) {
            if (release.name === '2.0.0') {
              r.hasRelease = true;
              r.releaseSha = release.commit.sha;
            }

            return release.name;
          });
        });
    }

    function checkGHPagesStatus(r) {
      ghApi.access_token = localStorage.getItem('access_token');
      return $http.get(API + 'repos/' + org + '/' + r.name + '/pages')
        .then(function (response) {
          console.log(response);
          r.ghPagesStatus = response.data.status;
        });
    }

    function enableGHPages(r) {
      ghApi.access_token = localStorage.getItem('access_token');
      const req = {
        method: 'POST',
        url: API + 'repos/' + org + '/' + r.name + '/pages',
        headers: {
          'Accept': 'application/vnd.github.switcheroo-preview+json'
        },
        data: {
          source: {
            branch: "gh-pages"
          }
        }
      }
      $http(req)
      .then(function (response) {
        console.log(response.data);
        setTimeout(() => {
          checkGHPagesStatus(r)
        }, 1000)
      });
    }
    main.enableGHPages = enableGHPages;

    function checkReadme(r) {
      r.hasReadme = false;
      return $http.get(API + 'repos/' + org + '/' + r.name + '/readme')
        .then(function (response) {
          r.hasReadme = response.data.name.indexOf('.md') > -1;
          r.readmeUrl = response.data.html_url;
        }, function () {
          return;
        });
    }

    function getCollaborators(r) {
      return $http.get(API + 'repos/' + org + '/' + r.name + '/collaborators')
        .then(function (response) {
          r.users = response.data.filter(function (c) {
            return c.login !== 'bfritscher';
          }).map(function (c) {
            var u = { login: c.login };
            getUser(u);
            return u;
          });
        });
    }

    function getCommitsPage(r, page) {
      return $http.get(API + 'repos/' + org + '/' + r.name + '/commits?per_page=100&page=' + page)
        .then(function (response) {
          r.commits = r.commits.concat(response.data);
          if (response.headers('link')) {
            console.log(response.headers('link'));
            var match = response.headers('link').match(/page=(\d+)>; rel="(.*?)"/);
            if (match[2] === 'next') {
              getCommitsPage(r, match[1]);
            }
          }
        }, function () {
          return;
        });
    }

    function getCommits(r) {
      r.commits = [];
      return getCommitsPage(r, 1);
    }

    function getUser(u) {
      //TODO lookup cache;
      return $http.get(API + 'users/' + u.login)
        .then(function (response) {
          u.name = response.data.name;
        });
    }

    function createIssue() {
      ghApi.access_token = localStorage.getItem('access_token');
      const evaluation = main.evals.pop();
      if (evaluation) {
        const issue = {
          "title": `Evaluation ${evaluation.repo}`,
          "body": evaluation.md
        };
        $http.post(API + 'repos/' + org + '/' + evaluation.repo + '/issues', issue).then(function (response) {
          main.evalsDone.push({
            repo: evaluation.repo,
            html_url: response.data.html_url
          });
          console.log(response.data);
        }).catch((e) => {
          console.log(e);
        });
        setTimeout(createIssue, 1000);
      }
    }

    function toMD(fields, data) {
      return fields.reduce((md, field) => {
        if (!isNaN(data[field]) && isNaN(field)) {
          if (field.startsWith('Note')) {
            md += `|**${field}** | **${data[field]}**|\n`;
          } else {
            md += `|${field} | ${data[field]}|\n`;
          }
        }
        if (field === 'Commentaires') {
          md += `\n\n### ${field}\n${data[field]}\n`;
        }
        return md;
      }, `## Evaluation ${data.repo}\n\n| Critères | Points |\n|---|---:|\n`);
    }

    function parseCSV(file) {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: function (results) {
          const fields = results.meta.fields.filter(f => f && !f.startsWith('_'));
          const evals = [];
          results.data.forEach(row => {
            const md = toMD(fields, row);
            evals.push({
              repo: row.repo,
              md: md,
              preview: marked(md)
            });
          });
          $scope.$apply(() => {
            main.evals = evals;
          });
        }
      });
    }

    main.handleFileSelect = function (event) {
      var file = event.target.files[0];
      parseCSV(file);
    };

    main.createIssue = createIssue;

  });

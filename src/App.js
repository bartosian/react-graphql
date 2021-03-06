import React, { Component } from 'react';
import axios from 'axios';

const axiosGitHubGraphQL = axios.create({
    baseURL: 'https://api.github.com/graphql',
    headers: {
        Authorization: "",
    }
});

const TITLE = 'React GraphQL GitHub Client';

const GET_ORGANIZATION = `
  {
    organization(login: "the-road-to-learn-react") {
      name
      url
    }
  }
`;

const GET_REPOSITORY_OF_ORGANIZATION = `
  {
    organization(login: "the-road-to-learn-react") {
      name
      url
      repository(name: "the-road-to-learn-react") {
        name
        url
      }
    }
  }
`;

const getIssuesOfRepositoryQuery = (organization, repository) => `
  {
    organization(login: "${organization}") {
      name
      url
      repository(name: "${repository}") {
        name
        url
        issues(last: 5, states: [OPEN]) {
          edges {
            node {
              id
              title
              url
              reactions(last: 3) {
                edges {
                  node {
                    id
                    content
                  }
                }
              }
            }
          }
        }
      }
    }
  }
`;

const getIssuesOfRepository = path => {
    const [organization, repository] = path.split('/');

    return axiosGitHubGraphQL.post('', {
        query: getIssuesOfRepositoryQuery(organization, repository),
    });
};

const resolveIssuesQuery = queryResult => () => ({
    organization: queryResult.data.data.organization,
    errors: queryResult.data.errors,
});

class App extends Component {
    state = {
        path: 'the-road-to-learn-react/the-road-to-learn-react',
        organization: null,
        errors: null,
    };

    componentDidMount() {
        this.onFetchFromGitHub(this.state.path);
    }

    onChange = event => {
        this.setState({ path: event.target.value });
    };

    onSubmit = event => {
        this.onFetchFromGitHub(this.state.path);

        event.preventDefault();
    };



    onFetchFromGitHub = path => {
        getIssuesOfRepository(path).then(queryResult =>
            this.setState(resolveIssuesQuery(queryResult)),
        );
    };

    render() {
        const { path, organization, errors } = this.state;

        return (
            <div>
                <h1>{TITLE}</h1>

                <form onSubmit={this.onSubmit}>
                    <label htmlFor="url">
                        Show open issues for https://github.com/
                    </label>
                    <input
                        id="url"
                        type="text"
                        value={path}
                        onChange={this.onChange}
                        style={{ width: '300px' }}
                    />
                    <button type="submit">Search</button>
                </form>

                <hr />

                {organization ? (
                    <Organization organization={organization} errors={errors} />
                ) : (
                    <p>No information yet ...</p>
                )}
            </div>
        );
    }
}

export default App;

const Organization = ({ organization, errors }) => {
    if (errors) {
        return (
            <p>
                <strong>Something went wrong:</strong>
                {errors.map(error => error.message).join(' ')}
            </p>
        );
    }

    return (
        <div>
            <p>
                <strong>Issues from Organization:</strong>
                <a href={organization.url}>{organization.name}</a>
            </p>
            <Repository repository={organization.repository} />
        </div>
    );
};

const Repository = ({ repository }) => (
    <div>
        <p>
            <strong>In Repository:</strong>
            <a href={repository.url}>{repository.name}</a>
        </p>

        <ul>
            {repository.issues.edges.map(issue => (
                <li key={issue.node.id}>
                    <a href={issue.node.url}>{issue.node.title}</a>
                    <ul>
                        {issue.node.reactions.edges.map(reaction => (
                            <li key={reaction.node.id}>{reaction.node.content}</li>
                        ))}
                    </ul>
                </li>
            ))}
        </ul>
    </div>
);
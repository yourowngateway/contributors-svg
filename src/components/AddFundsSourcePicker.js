import React from 'react';
import PropTypes from 'prop-types';
import gql from 'graphql-tag'
import { FormControl } from 'react-bootstrap';
import { graphql } from 'react-apollo'
import { defineMessages, FormattedMessage } from 'react-intl';
import { get, uniqBy, groupBy } from 'lodash';
import withIntl from '../lib/withIntl';

class AddFundsSourcePicker extends React.Component {

  static propTypes = {
    host: PropTypes.object,
    paymentMethod: PropTypes.object.isRequired,
    collective: PropTypes.object,
    onChange: PropTypes.func
  }

  constructor(props) {
    super(props);
    this.onChange = this.onChange.bind(this);
    this.messages = defineMessages({
      "collective": { id: "collective.types.collective", defaultMessage: "{n, plural, one {collective} other {collectives}}" },
      "organization": { id: "collective.types.organization", defaultMessage: "{n, plural, one {organization} other {organizations}}" },
      "user": { id: "collective.types.user", defaultMessage: "{n, plural, one {people} other {people}}" }
    });
  }

  onChange(e) {
    const FromCollectiveId = e.target.value;
    this.props.onChange(FromCollectiveId);
  }

  renderSeparator(type) {
    if (!this.fromCollectivesByType[type]) return;
    const { intl } = this.props;

    let label = intl.formatMessage(this.messages[type.toLowerCase()], { n: this.fromCollectivesByType[type].length });
    if (label.length % 2 !== 0) {
      label += ' ';
    }

    let dashes = '';
    for (let i=0; i < (40 - label.length) / 2; i++) {
      dashes += '-';
    }

    return (<option value="">{`${dashes} ${(label).toUpperCase()} ${dashes}`}</option>)
  }

  renderSourceEntry(fromCollective) {
    return (<option key={`${fromCollective.type}-${fromCollective.id}`} value={fromCollective.id}>{fromCollective.name}</option>);
  }

  render() {
    const { host, data: { loading, PaymentMethod } } = this.props;
    if (loading) return (<div />);
    const fromCollectives = get(PaymentMethod, 'fromCollectives.collectives', []).filter(c => c.id !== host.id);
    this.fromCollectivesByType = {
      ORGANIZATION: [],
      COLLECTIVE: [],
      USER: [],
      ...groupBy(fromCollectives, m => get(m, 'type')),
    };
    return (
      <FormControl id="sourcePicker" name="template" componentClass="select" placeholder="select" onChange={this.onChange}>
        <option value={host.id}><FormattedMessage id="addfunds.fromCollective.host" values={{ host: host.name}} defaultMessage="Host ({host})" /></option>
        { this.fromCollectivesByType['COLLECTIVE'].length > 0 && this.renderSeparator("COLLECTIVE") }
        { this.fromCollectivesByType['COLLECTIVE'].map(this.renderSourceEntry) }

        { this.fromCollectivesByType['ORGANIZATION'].length > 0 && this.renderSeparator("ORGANIZATION") }
        { this.fromCollectivesByType['ORGANIZATION'].map(this.renderSourceEntry) }

        { this.fromCollectivesByType['USER'].length > 0 && this.renderSeparator("USER") }
        { this.fromCollectivesByType['USER'].map(this.renderSourceEntry) }

        <option value="">---------------</option>
        <option value="other"><FormattedMessage id="addfunds.fromCollective.other" defaultMessage="other (please specify)" /></option>
      </FormControl>
    );
  }
}

class AddFundsSourcePickerForUser extends React.Component {
  static propTypes = {
    onChange: PropTypes.func,
    LoggedInUser: PropTypes.object.isRequired,
  }

  constructor(props) {
    super(props);
    this.state = { loading: true };
  }

  onChange = async (e) => {
    this.props.onChange(e.target.value);
  }

  render() {
    const hosts = this.props.LoggedInUser.hostsUserIsAdminOf();
    return (
      <div>
        <FormControl
          id="sourcePicker" name="template" componentClass="select"
          placeholder="select" onChange={this.onChange}
          >
          <option value="" key="addfsph-00"></option>
          { hosts.map(h => <option value={h.id} key={`addfsph-${h.id}`}>{h.name}</option>) }
        </FormControl>
      </div>
    );
  }
}

const getSourcesQuery = gql`
query PaymentMethod($id: Int!) {
  PaymentMethod(id: $id) {
    id
    fromCollectives {
      total
      collectives {
        id
        type
        name
        slug
      }
    }
  }
}
`;

const addOrganizationsData = graphql(getSourcesQuery, {
  options: (props) => ({
    variables: {
      id: props.paymentMethod.id
    }
  })
});

export const AddFundsSourcePickerWithData = withIntl(addOrganizationsData(AddFundsSourcePicker));

export const AddFundsSourcePickerForUserWithData = withIntl(AddFundsSourcePickerForUser);

export default AddFundsSourcePickerWithData;
